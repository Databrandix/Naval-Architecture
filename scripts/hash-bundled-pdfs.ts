/**
 * Put a content hash in the name of every bundled PDF the database points at.
 *
 *   npx tsx --env-file=.env scripts/hash-bundled-pdfs.ts [--dry-run]
 *
 * Next.js serves everything under public/ with `Cache-Control: max-age=1y,
 * immutable`. A browser takes `immutable` at its word: it will not ask
 * whether the file changed, not even on a reload. Replacing a document at the
 * same path therefore reaches nobody who had already opened the old one, and
 * nothing anywhere reports the problem — the server is serving the new file
 * and the visitor is reading the old one.
 *
 * This closes that off for the documents a department actually replaces: the
 * syllabus, the prospectus, the course structure, the admission notices, the
 * layout plan. A new document hashes differently, so it gets a new URL, and
 * the URL a visitor has cached is simply no longer the one the page links to.
 *
 * Only PDFs. The bundled images — hero shots, covers, the crest — are also
 * named in the source as fallbacks for pages whose database row has no
 * picture yet, and renaming those would break the fallback while leaving the
 * database perfectly consistent. They are static art that does not get
 * reissued; the documents do.
 *
 * Cloudinary URLs are left alone: uploads already carry a version in the
 * path. Safe to run repeatedly — a file already named for its own contents
 * is skipped.
 */
import { createHash } from 'node:crypto';
import { readFile, readdir, rename, stat } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const DRY_RUN = process.argv.includes('--dry-run');

const prisma = new PrismaClient();

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const SRC_DIR = path.join(process.cwd(), 'src');

/** Each model that stores a path to a bundled document, and the column holding it. */
const TARGETS = [
  { label: 'Syllabus', field: 'pdfUrl', rows: () => prisma.syllabus.findMany(), update: (id: string, url: string) => prisma.syllabus.update({ where: { id }, data: { pdfUrl: url } }) },
  { label: 'Prospectus', field: 'pdfUrl', rows: () => prisma.prospectusEntry.findMany(), update: (id: string, url: string) => prisma.prospectusEntry.update({ where: { id }, data: { pdfUrl: url } }) },
  { label: 'Course curriculum', field: 'pdfUrl', rows: () => prisma.programCurriculum.findMany(), update: (id: string, url: string) => prisma.programCurriculum.update({ where: { id }, data: { pdfUrl: url } }) },
  { label: 'Admission notice', field: 'fileUrl', rows: () => prisma.admissionNotice.findMany(), update: (id: string, url: string) => prisma.admissionNotice.update({ where: { id }, data: { fileUrl: url } }) },
  { label: 'Layout plan', field: 'pdfUrl', rows: () => prisma.departmentLayout.findMany(), update: (id: string, url: string) => prisma.departmentLayout.update({ where: { id }, data: { pdfUrl: url } }) },
] as const;

const HASHED = /-[0-9a-f]{8}$/;

/** Strip a hash this script added earlier, so re-running does not stack them. */
function baseStem(fileName: string): string {
  const ext = path.extname(fileName);
  const stem = path.basename(fileName, ext);
  return HASHED.test(stem) ? stem.slice(0, -9) : stem;
}

/**
 * Whether any source file names this asset.
 *
 * A file named in the source is a fallback the database does not know about;
 * renaming it would leave the page pointing at nothing. Better to skip it and
 * say so than to fix the caching and break the picture.
 */
async function referencedInSource(fileName: string): Promise<boolean> {
  const stack = [SRC_DIR];
  while (stack.length > 0) {
    const dir = stack.pop() as string;
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (/\.(tsx?|jsx?|mjs|css)$/.test(entry.name)) {
        if ((await readFile(full, 'utf8')).includes(fileName)) return true;
      }
    }
  }
  return false;
}

async function main() {
  /* One rename per file, however many rows point at it. */
  const renames = new Map<string, string>();
  const skipped: string[] = [];
  let updates = 0;

  for (const target of TARGETS) {
    const rows = (await target.rows()) as Record<string, unknown>[];

    for (const row of rows) {
      const url = row[target.field];
      if (typeof url !== 'string' || !url.startsWith('/assets/') || !url.endsWith('.pdf')) continue;

      const id = row.id as string;
      const fileName = path.basename(url);

      let newUrl = renames.get(url);
      if (!newUrl) {
        if (skipped.includes(fileName)) continue;

        const filePath = path.join(PUBLIC_DIR, 'assets', fileName);
        const exists = await stat(filePath).then(() => true).catch(() => false);
        if (!exists) {
          console.log(`  ${target.label}: ${fileName} is not in public/assets — left alone`);
          skipped.push(fileName);
          continue;
        }

        if (await referencedInSource(fileName)) {
          console.log(`  ${target.label}: ${fileName} is named in the source — left alone`);
          skipped.push(fileName);
          continue;
        }

        const hash = createHash('sha256').update(await readFile(filePath)).digest('hex').slice(0, 8);
        const newName = `${baseStem(fileName)}-${hash}.pdf`;
        if (newName === fileName) {
          console.log(`  ${target.label}: ${fileName} already names its contents`);
          skipped.push(fileName);
          continue;
        }

        newUrl = `/assets/${newName}`;
        renames.set(url, newUrl);
        if (!DRY_RUN) await rename(filePath, path.join(PUBLIC_DIR, 'assets', newName));
        console.log(`  ${target.label}: ${fileName} → ${newName}`);
      }

      if (!DRY_RUN) await target.update(id, newUrl);
      updates += 1;
    }
  }

  console.log(
    `\n${DRY_RUN ? 'Would rename' : 'Renamed'} ${renames.size} file(s), ${DRY_RUN ? 'updating' : 'updated'} ${updates} row(s).`,
  );
  if (skipped.length > 0) console.log(`Left alone: ${skipped.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
