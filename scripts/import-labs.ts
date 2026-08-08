/**
 * Import laboratories from the department's "Laboratory Information"
 * spreadsheet.
 *
 *   npx tsx --env-file=.env scripts/import-labs.ts <xlsx path>
 *
 * The sheet's picture column holds Google Drive share links rather than files.
 * Each one is fetched through Drive's download endpoint and uploaded to
 * Cloudinary, so the site serves its own copy: a Drive link can be unshared or
 * the file moved, and the page would then show a broken image with nothing in
 * this repository to explain why.
 *
 * Re-running updates matching labs by slug and re-uploads their pictures to
 * the same Cloudinary ids.
 */
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import * as XLSX from 'xlsx';

const [, , xlsxPath] = process.argv;
if (!xlsxPath) {
  console.error('usage: npx tsx --env-file=.env scripts/import-labs.ts <xlsx path>');
  process.exit(1);
}

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const COLUMN = {
  name: 'Laboratory Name',
  purpose: 'Purpose / Function',
  equipment: 'Major Equipment',
  software: 'Software (If any)',
  count: 'Number of Equipment',
  capacity: 'Lab Capacity (Students)',
  courses: 'Courses Supported',
  room: 'Location / Room No',
  inCharge: 'Lab In-Charge',
  safety: 'Safety Facilities',
  picture: 'Picture File Name',
} as const;

const text = (v: unknown): string => String(v ?? '').replace(/\r/g, '').trim();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Turn "A; B; C." into "A, B and C" — a sentence, not a machine's list. */
function sentenceList(value: string): string {
  const parts = value
    .split(/;\s*/)
    .map((s) => s.trim().replace(/\.$/, ''))
    .filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/** Drive share links are viewer pages; this is the address of the file itself. */
function driveDownloadUrl(shareLink: string): string | null {
  const match = shareLink.match(/\/file\/d\/([^/]+)/) ?? shareLink.match(/[?&]id=([^&]+)/);
  return match ? `https://drive.google.com/uc?export=download&id=${match[1]}` : null;
}

async function uploadPicture(shareLink: string, slug: string) {
  const url = driveDownloadUrl(shareLink);
  if (!url) return null;

  const response = await fetch(url);
  if (!response.ok) {
    console.log(`    picture failed: Drive answered ${response.status}`);
    return null;
  }

  const type = response.headers.get('content-type') ?? '';
  if (!type.startsWith('image/')) {
    /* Drive serves an HTML "can't scan this file" page for large files and a
       sign-in page for unshared ones — both arrive as 200. */
    console.log(`    picture failed: Drive returned ${type || 'no content type'}, not an image`);
    return null;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const dataUri = `data:${type};base64,${buffer.toString('base64')}`;

  const uploaded = await cloudinary.uploader.upload(dataUri, {
    folder: `${process.env.CLOUDINARY_UPLOAD_FOLDER}/labs`,
    public_id: slug,
    overwrite: true,
  });

  return { url: uploaded.secure_url, publicId: uploaded.public_id, width: uploaded.width, height: uploaded.height };
}

/**
 * The description a visitor reads: what the lab is for, what is in it, and who
 * can be found there. Assembled from the sheet's separate columns because none
 * of them is a description on its own.
 */
function buildDescription(row: Record<string, unknown>): string {
  const paragraphs: string[] = [];

  const purpose = text(row[COLUMN.purpose]);
  if (purpose) paragraphs.push(purpose);

  const equipment = sentenceList(text(row[COLUMN.equipment]));
  if (equipment) paragraphs.push(`Equipment includes ${equipment}.`);

  const software = sentenceList(text(row[COLUMN.software]));
  if (software) paragraphs.push(`Software: ${software}.`);

  const courses = sentenceList(text(row[COLUMN.courses]));
  if (courses) paragraphs.push(`Supports ${courses}.`);

  const safety = text(row[COLUMN.safety]);
  if (safety) paragraphs.push(safety);

  return paragraphs.join('\n\n');
}

/** One line under the lab's name: where it is and how many it seats. */
function buildTagline(row: Record<string, unknown>): string {
  const room = text(row[COLUMN.room]);
  const capacity = text(row[COLUMN.capacity]);
  const bits: string[] = [];
  if (room) bits.push(room.toLowerCase() === 'underground' ? 'Underground floor' : `Room ${room}`);
  if (capacity) bits.push(`${capacity} students`);
  return bits.join(' · ');
}

async function main() {
  const workbook = XLSX.read(readFileSync(xlsxPath));
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    workbook.Sheets['Laboratory_Information'],
    { defval: '' },
  );

  let order = 0;

  for (const row of rows) {
    const name = text(row[COLUMN.name]);
    if (!name) continue;

    const slug = slugify(name);
    order += 1;

    console.log(`${name}`);

    const shareLink = text(row[COLUMN.picture]);
    const picture = shareLink ? await uploadPicture(shareLink, slug) : null;
    if (!shareLink) console.log('    no picture in the spreadsheet');

    const data = {
      name,
      tagline: buildTagline(row),
      description: buildDescription(row),
      displayOrder: order,
      ...(picture
        ? { heroImageUrl: picture.url, heroImagePublicId: picture.publicId }
        : {}),
    };

    await prisma.lab.upsert({ where: { slug }, update: data, create: { slug, ...data, gallery: [], galleryPublicIds: [] } });

    console.log(`    ${data.tagline || 'no location given'}`);
    if (picture) console.log(`    picture ${picture.width}×${picture.height}`);
  }

  console.log(`\n${order} laboratories`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
