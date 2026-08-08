/**
 * Import news, events and notices from the department's
 * "News and Events Information" spreadsheet.
 *
 *   npx tsx --env-file=.env scripts/import-news-events.ts <xlsx path> [image folder]
 *
 * Three sheets, three tables. What they share is how the department writes
 * things down, which this script has to undo:
 *
 *   · Dates arrive three ways — a real date, an Excel serial number, and the
 *     string "-" for undecided. All three end up as a date or as nothing.
 *   · Cover images are Google Drive share links, fetched and re-uploaded to
 *     Cloudinary so the site serves its own copy.
 *   · Event photographs are not in the sheet at all: they sit in folders named
 *     after the event. The folder name is matched to the event title.
 *   · "Extra Info" and "Details" are written as `Label : value ; Label : value`,
 *     which is a table someone typed into one cell.
 *
 * Safe to run again: rows are matched on slug and updated in place.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import * as XLSX from 'xlsx';

const [, , xlsxPath, imageRoot] = process.argv;
if (!xlsxPath) {
  console.error('usage: npx tsx --env-file=.env scripts/import-news-events.ts <xlsx path> [image folder]');
  process.exit(1);
}

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const text = (v: unknown): string => String(v ?? '').replace(/\r/g, '').trim();

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

/**
 * A date from a spreadsheet cell.
 *
 * Excel stores dates as days since 1899-12-30, and a column with a few typed
 * dates in it comes back as a mixture of Date objects, those serial numbers,
 * and whatever else was typed — "-" for a date not yet fixed. Anything that is
 * not a date returns null rather than 1970.
 */
function parseDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  const raw = text(value);
  if (!raw || raw === '-' || raw.toUpperCase() === 'N/A') return null;

  /* A bare year first. "2024" is also a valid Excel serial — for a day in
     1905 — and reading it as one turned every year-only row into 1905. Excel
     serials for any date this century are five digits, so four digits in a
     plausible year range is a year. */
  if (/^(19|20)\d{2}$/.test(raw)) return new Date(`${raw}-01-01T00:00:00Z`);

  if (/^\d{5}$/.test(raw)) {
    const serial = Number(raw);
    /* Excel's epoch, with the 1900 leap-year bug already accounted for by the
       -25569 offset used everywhere for this conversion. */
    const date = new Date((serial - 25569) * 86400 * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** "Presenter : X ; Conference : Y" is a table typed into one cell. */
function parseLabelledList(value: unknown): { label: string; value: string }[] {
  return text(value)
    .split(/\s*;\s*/)
    .map((pair) => pair.split(/\s*:\s*/))
    .filter((parts) => parts.length >= 2 && parts[0].trim() && parts.slice(1).join(': ').trim())
    .map((parts) => ({ label: parts[0].trim(), value: parts.slice(1).join(': ').trim() }));
}

const paragraphs = (value: unknown): string[] =>
  text(value)
    .split(/\n\s*\n|\n/)
    .map((line) => line.trim())
    .filter(Boolean);

/* ------------------------------------------------------------------ images */

function driveDownloadUrl(link: string): string | null {
  const match = link.match(/\/file\/d\/([^/]+)/) ?? link.match(/[?&]id=([^&]+)/);
  return match ? `https://drive.google.com/uc?export=download&id=${match[1]}` : null;
}

/**
 * Fetch a Drive link and re-upload it.
 *
 * Returns null on any failure rather than throwing: one unreachable link
 * should cost the site one picture, not the whole import. Which links failed
 * is printed as each row is written.
 */
/**
 * A picture already uploaded under this id on an earlier run.
 *
 * The department's links live on Google Drive and this import has had to be
 * re-run through a flaky connection more than once. Without this, a fetch that
 * fails the second time would replace a good picture with the fallback banner —
 * the import would undo its own earlier work.
 */
async function existingUpload(folder: string, publicId: string) {
  try {
    const resource = await cloudinary.api.resource(
      `${process.env.CLOUDINARY_UPLOAD_FOLDER}/${folder}/${publicId}`,
    );
    return { url: resource.secure_url as string, publicId: resource.public_id as string };
  } catch {
    return null;
  }
}

async function uploadFromDrive(link: string, folder: string, publicId: string) {
  const url = driveDownloadUrl(link);
  if (!url) return null;

  try {
    const response = await fetch(url, { redirect: 'follow' });
    if (!response.ok) return null;

    const type = response.headers.get('content-type') ?? '';
    /* Drive answers 200 with an HTML sign-in page for a link that is not
       shared, and with a scan warning for large files. Neither is a picture. */
    if (!type.startsWith('image/')) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    const uploaded = await cloudinary.uploader.upload(
      `data:${type};base64,${buffer.toString('base64')}`,
      {
        folder: `${process.env.CLOUDINARY_UPLOAD_FOLDER}/${folder}`,
        public_id: publicId,
        overwrite: true,
        timeout: 120_000,
      },
    );
    return { url: uploaded.secure_url, publicId: uploaded.public_id };
  } catch {
    return existingUpload(folder, publicId);
  }
}

/**
 * Cloudinary's free plan refuses uploads over 10 MB, and phone photographs
 * routinely exceed it — one of these was 12.6 MB. Anything close to the limit
 * is re-encoded first: 2400px is wider than any slot on the site, so nothing
 * visible is lost, and the file drops to a fraction of its size.
 */
const UPLOAD_LIMIT_BYTES = 9 * 1024 * 1024;

async function readImageForUpload(filePath: string): Promise<{ buffer: Buffer; mime: string }> {
  const original = readFileSync(filePath);
  if (original.byteLength <= UPLOAD_LIMIT_BYTES) {
    const extension = path.extname(filePath).toLowerCase().replace('.', '');
    return { buffer: original, mime: `image/${extension === 'jpg' ? 'jpeg' : extension || 'jpeg'}` };
  }

  const sharp = (await import('sharp')).default;
  const resized = await sharp(original).rotate().resize({ width: 2400, withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
  console.log(
    `      resized ${(original.byteLength / 1048576).toFixed(1)} MB → ${(resized.byteLength / 1048576).toFixed(1)} MB`,
  );
  return { buffer: resized, mime: 'image/jpeg' };
}

async function uploadLocal(filePath: string, folder: string, publicId: string) {
  try {
    const { buffer, mime } = await readImageForUpload(filePath);
    const uploaded = await cloudinary.uploader.upload(
      `data:${mime};base64,${buffer.toString('base64')}`,
      {
        folder: `${process.env.CLOUDINARY_UPLOAD_FOLDER}/${folder}`,
        public_id: publicId,
        overwrite: true,
        /* Two minutes: these are event photographs from a phone, and the
           default sixty seconds is not enough for one over a slow link. */
        timeout: 120_000,
      },
    );
    return { url: uploaded.secure_url, publicId: uploaded.public_id };
  } catch {
    return existingUpload(folder, publicId);
  }
}

/**
 * Photographs live in folders named after the event, not always with the same
 * words as the title: "Welcome Onboard: Freshers' Reception for Fall 2025" is
 * filed under "Freshers' Reception for Fall 2025". Matching on the longest
 * shared run of words finds the folder without a hand-written mapping that the
 * next department would have to redo.
 */
function findEventFolder(title: string, root: string): string | null {
  if (!root || !existsSync(root)) return null;

  const normalise = (s: string) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const titleWords = new Set(normalise(title).split(' ').filter((w) => w.length > 3));

  let best: { name: string; score: number } | null = null;

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const folderWords = normalise(entry.name).split(' ').filter((w) => w.length > 3);
    const score = folderWords.filter((w) => titleWords.has(w)).length / Math.max(folderWords.length, 1);
    if (score > 0.5 && (!best || score > best.score)) best = { name: entry.name, score };
  }

  return best ? path.join(root, best.name) : null;
}

function firstImageIn(folder: string): string | null {
  const files = readdirSync(folder).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
  return files.length > 0 ? path.join(folder, files[0]) : null;
}

/* -------------------------------------------------------------------- news */

async function importNews(rows: Record<string, unknown>[]) {
  console.log('NEWS');
  let order = 0;

  for (const row of rows) {
    const title = text(row.Title);
    if (!title) continue;
    order += 1;

    const slug = slugify(title);
    const publishedAt = parseDate(row['Published Date']) ?? new Date();
    const cover = await uploadFromDrive(text(row['Cover Image (file name)']), 'news', slug);

    const data = {
      title,
      shortTitle: text(row['Short Title']) || title,
      category: text(row.Category) || 'News',
      publishedAt,
      displayDate: text(row['Display Date (optional)']) || null,
      summary: text(row.Summary),
      /* The cover is required by the schema; a story without a usable picture
         falls back to the site's own banner rather than blocking the import. */
      coverUrl: cover?.url ?? '/assets/og-banner.webp',
      coverPublicId: cover?.publicId ?? null,
      body: paragraphs(row['Body / Full Details']),
      meta: parseLabelledList(row['Extra Info (optional)']),
    };

    await prisma.news.upsert({ where: { slug }, update: data, create: { slug, ...data } });
    console.log(`  ${publishedAt.getFullYear()}  ${title.slice(0, 58)}${cover ? '  ✓image' : '  (no image)'}`);
  }
  console.log(`  ${order} stories\n`);
}

/* ------------------------------------------------------------------ events */

async function importEvents(rows: Record<string, unknown>[], root: string) {
  console.log('EVENTS');
  let order = 0;

  for (const row of rows) {
    const title = text(row.Title);
    if (!title) continue;
    order += 1;

    const slug = slugify(title);

    let image = await uploadFromDrive(text(row['Image (file name)']), 'events', slug);
    let source = 'drive';

    if (!image) {
      const folder = findEventFolder(title, root);
      const file = folder ? firstImageIn(folder) : null;
      if (file) {
        image = await uploadLocal(file, 'events', slug);
        source = path.basename(folder!);
      }
    }

    const eventDate = parseDate(row['Event Date']);

    const data = {
      title,
      shortTitle: text(row['Short Title']) || title,
      category: text(row.Category) || 'Event',
      status: text(row.Status) || 'Past',
      eventDate,
      displayDate: text(row['Display Date (optional)']) || null,
      time: text(row['Time (optional)']) || null,
      venue: text(row['Venue (optional)']) || null,
      imageUrl: image?.url ?? '/assets/og-banner.webp',
      imagePublicId: image?.publicId ?? null,
      summary: text(row.Summary),
      description: paragraphs(row['Description / Full Details']),
      focus: text(row.Focus),
      details: parseLabelledList(row['Details (optional)']),
      ctaLabel: text(row['Button Label (optional)']) || null,
      ctaHref: text(row['Button Link (optional)']) || null,
    };

    await prisma.event.upsert({ where: { slug }, update: data, create: { slug, ...data } });
    console.log(
      `  ${eventDate ? eventDate.toISOString().slice(0, 10) : '          '}  ${title.slice(0, 52)}${image ? `  ✓${source}` : '  (no image)'}`,
    );
  }
  console.log(`  ${order} events\n`);
}

/* ----------------------------------------------------------------- notices */

async function importNotices(rows: Record<string, unknown>[]) {
  console.log('NOTICES');
  let order = 0;

  for (const row of rows) {
    const title = text(row.Title);
    if (!title) continue;
    order += 1;

    const slug = slugify(title);
    const attachment = text(row['Attachment File (file name)']);
    const publishedAt = parseDate(row['Published Date']);

    /* A notice with no date is still a notice; it takes today's date so it
       appears at the top rather than in 1970 or not at all. */
    const dated = publishedAt ?? new Date();

    const hasAttachment = Boolean(attachment) && attachment.toUpperCase() !== 'N/A' && attachment !== '-';
    const file = hasAttachment ? await uploadFromDrive(attachment, 'notices', slug) : null;

    /**
     * Some attachments cannot be hosted here: an examination routine kept as a
     * Google Sheet is a living document, and this Cloudinary account refuses
     * PDF delivery. Rather than drop them, the original address is kept and
     * marked as a link, so the notice still leads somewhere — the page offers
     * "View" without a download for these.
     */
    const externalLink = hasAttachment && !file ? attachment : null;

    const data = {
      title,
      category: text(row.Category) || 'Notice',
      department: text(row['Issued By (Department/Office']) || 'Department of Naval Architecture and Marine Engineering',
      publishedAt: dated,
      displayDate: text(row['Display Date (optional)']) || null,
      description: text(row.Description),
      fileUrl: file?.url ?? externalLink,
      filePublicId: file?.publicId ?? null,
      fileType: file ? 'image' : externalLink ? 'link' : null,
      fileName: file ? `${slug}.jpg` : null,
    };

    await prisma.notice.upsert({ where: { slug }, update: data, create: { slug, ...data } });

    const flag = file ? '✓file' : attachment && attachment.toUpperCase() !== 'N/A' ? '(link not an image)' : '';
    console.log(`  ${dated.toISOString().slice(0, 10)}  ${title.slice(0, 54)}  ${flag}`);
  }
  console.log(`  ${order} notices`);
}

async function main() {
  const workbook = XLSX.read(readFileSync(xlsxPath), { cellDates: true });
  const sheet = (name: string) =>
    XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[name], { defval: '' });

  await importNews(sheet('News'));
  await importEvents(sheet('Events'), imageRoot ?? '');
  await importNotices(sheet('Notice Board'));
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
