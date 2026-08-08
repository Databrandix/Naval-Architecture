/**
 * Import faculty from the department's "Faculty Information" spreadsheet.
 *
 *   npx tsx --env-file=.env scripts/import-faculty.ts <xlsx path>
 *
 * The sheet gives one row per teacher, with the long fields — academic
 * background, experience, publications — as free text in a single cell. Those
 * cells separate their entries inconsistently: blank lines in some columns,
 * semicolons in others, plain newlines in the rest. splitEntries handles all
 * three rather than picking one and mangling the columns that use another.
 *
 * Photographs are not in the spreadsheet; its photo column holds one shared
 * Google Drive folder link for everybody. PHOTOS below maps a slug to an
 * already-uploaded image, and a teacher with no entry simply gets no picture.
 *
 * Re-running updates the matching rows and leaves anything edited in the admin
 * panel that the spreadsheet does not cover — the message from the head, for
 * instance — untouched.
 */
import { readFileSync } from 'node:fs';
import { PrismaClient, type FacultyType } from '@prisma/client';
import * as XLSX from 'xlsx';

const [, , xlsxPath] = process.argv;
if (!xlsxPath) {
  console.error('usage: npx tsx --env-file=.env scripts/import-faculty.ts <xlsx path>');
  process.exit(1);
}

const prisma = new PrismaClient();

/** Uploaded separately; the spreadsheet has no per-person image. */
const PHOTOS: Record<string, string> = {
  'khabirul-haque-chowdhury':
    'https://res.cloudinary.com/dsexj8z6u/image/upload/v1786205558/sonargaon-naval/faculty/khabirul-haque-chowdhury.png',
  'sheikh-abid-ibn-shahed':
    'https://res.cloudinary.com/dsexj8z6u/image/upload/v1786205560/sonargaon-naval/faculty/sheikh-abid-ibn-shahed.png',
  'md-mahmudul-hasan-akib':
    'https://res.cloudinary.com/dsexj8z6u/image/upload/v1786205566/sonargaon-naval/faculty/md-mahmudul-hasan-akib.jpg',
};

const COLUMN = {
  name: 'Name',
  facultyType: 'Faculty Type',
  position: 'Position',
  email: 'Mail',
  phone: 'Mobile Number',
  suId: 'SU ID',
  academic: 'Academic Background\r\n(HSC,B.Sc. , M.Sc. Ph.D ',
  biography: 'Short Biography ',
  experience: 'Professional Experience',
  publications: 'Publication',
  awards: 'Awards and Achievement',
  specialisation: 'Field of Specialisation ',
  interest: 'Field of Interest ',
  scholar: 'Google Scholar / Research Link',
  membership: 'Fellowship/Membership of Scientific and Professional Society ',
} as const;

const text = (v: unknown): string => String(v ?? '').replace(/\r/g, '').trim();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Split one cell into list entries.
 *
 * Blank lines first, because a cell that uses them means them. Only when there
 * are none does a semicolon count as a separator — splitting on semicolons
 * first would cut "Dhaka, Bangladesh; 2019" style entries in half.
 */
function splitEntries(value: string): string[] {
  const cell = text(value);
  if (!cell) return [];

  const byBlankLine = cell.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  if (byBlankLine.length > 1) return byBlankLine;

  const byLine = cell.split('\n').map((s) => s.trim()).filter(Boolean);
  if (byLine.length > 1) {
    return byLine.flatMap((line) =>
      line.split(/;\s*/).map((s) => s.trim().replace(/[;,]$/, '')).filter(Boolean),
    );
  }

  const bySemicolon = cell.split(/;\s*/).map((s) => s.trim().replace(/\.$/, '')).filter(Boolean);
  return bySemicolon.length > 1 ? bySemicolon : [cell];
}

/** A numbered publication list reads better without its numbers doubled by the bullets. */
const stripLeadingNumber = (entry: string): string => entry.replace(/^\d+[.)]\s*/, '');

function facultyType(raw: string, isHead: boolean): FacultyType {
  if (isHead) return 'leadership';
  return /part/i.test(raw) ? 'part_time' : 'full_time';
}

async function main() {
  const workbook = XLSX.read(readFileSync(xlsxPath));
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  /* Row 0 is a title banner; the real header is row 1. */
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { range: 1, defval: '' });

  let order = 0;

  for (const row of rows) {
    const name = text(row[COLUMN.name]);
    if (!name) continue;

    const slug = slugify(name);
    const position = text(row[COLUMN.position]);
    const isHead = /head/i.test(position);
    const scholarLink = text(row[COLUMN.scholar]);

    order += 1;

    const data = {
      name,
      designation: position,
      type: facultyType(text(row[COLUMN.facultyType]), isHead),
      badge: isHead ? 'Head of Department' : null,
      displayOrder: order,
      isHead,
      email: text(row[COLUMN.email]) || null,
      phone: text(row[COLUMN.phone]) || null,
      suId: text(row[COLUMN.suId]) || null,
      photoUrl: PHOTOS[slug] ?? null,

      personalInfo: [
        { label: 'Short Biography', value: text(row[COLUMN.biography]) },
      ].filter((r) => r.value),

      academicQualification: splitEntries(text(row[COLUMN.academic])),
      previousEmployment: splitEntries(text(row[COLUMN.experience])),
      teachingArea: splitEntries(text(row[COLUMN.specialisation])),
      awards: splitEntries(text(row[COLUMN.awards])),
      membership: splitEntries(text(row[COLUMN.membership])),
      publications: splitEntries(text(row[COLUMN.publications])).map(stripLeadingNumber),

      /* Research interests, with the profile link as its own entry so it is a
         link on the page rather than a bare URL in a sentence. */
      research: [
        ...splitEntries(text(row[COLUMN.interest])),
        ...(scholarLink ? [{ text: 'Google Scholar / research profile', url: scholarLink }] : []),
      ],
    };

    const saved = await prisma.faculty.upsert({
      where: { slug },
      update: data,
      create: { slug, ...data },
    });

    const counts = [
      `${(data.academicQualification as string[]).length} qualifications`,
      `${(data.publications as string[]).length} publications`,
      `${(data.awards as string[]).length} awards`,
    ].join(' · ');
    console.log(`${saved.name}`);
    console.log(`  ${saved.designation} · ${saved.type}${saved.isHead ? ' · head' : ''}`);
    console.log(`  ${counts}${data.photoUrl ? ' · photo' : ' · NO PHOTO'}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
