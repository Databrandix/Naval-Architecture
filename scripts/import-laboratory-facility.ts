/**
 * The Laboratory Facility page.
 *
 *   npx tsx --env-file=.env scripts/import-laboratory-facility.ts <xlsx path>
 *
 * One card per laboratory, carrying everything the department's Laboratory
 * Information spreadsheet records: what the room is for, its equipment and
 * software, the courses it serves, where it is, how many it seats, who staffs
 * it and how it is kept safe.
 *
 * This is the detail page. /about/lab-facility is the same rooms with their
 * photographs and a short description — someone looking at pictures. Here they
 * are reading specifications, so nothing from the sheet is left out.
 *
 * Safe to run again: it replaces every card and rewrites the landing copy.
 */
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const [, , xlsxPath] = process.argv;
if (!xlsxPath) {
  console.error('usage: npx tsx --env-file=.env scripts/import-laboratory-facility.ts <xlsx path>');
  process.exit(1);
}

const prisma = new PrismaClient();

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
} as const;

/**
 * A Lucide icon per laboratory, matched on what the room does. Falls back to a
 * flask for a laboratory this list has not seen — a department with a room
 * called something else gets a generic icon, not a broken one.
 */
const ICONS: { pattern: RegExp; icon: string }[] = [
  { pattern: /machine tool|workshop|machining/i, icon: 'Wrench' },
  { pattern: /weld/i, icon: 'Flame' },
  { pattern: /solid mechanic|structure|strength/i, icon: 'Gauge' },
  { pattern: /material|metall/i, icon: 'Layers' },
  { pattern: /fluid machinery|hydraulic machine|pump|turbine/i, icon: 'Cog' },
  { pattern: /fluid mechanic|hydraulic/i, icon: 'Waves' },
  { pattern: /heat engine|engine|combustion/i, icon: 'Gauge' },
  { pattern: /heat transfer|thermal|thermo/i, icon: 'Thermometer' },
  { pattern: /ship design|drawing|cad/i, icon: 'PenTool' },
];

const iconFor = (name: string): string =>
  ICONS.find(({ pattern }) => pattern.test(name))?.icon ?? 'FlaskConical';

const text = (v: unknown): string => String(v ?? '').replace(/\r/g, '').trim();

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

/**
 * The in-charge cell is a small block: a name, a role, a phone number, an
 * ampersand, then the next person. Kept as lines so the card can show it as
 * written, with the department's own misspelling of "Officer" corrected —
 * it appears on every row and would be read as the site's mistake, not theirs.
 */
function tidyInCharge(value: string): string {
  return text(value)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/\bOffier\b/g, 'Officer'))
    .join('\n');
}

const INTRO =
  'Ship design is taught at a desk and learned at a machine. The department’s laboratories run the length of the discipline — cutting and welding steel, loading it until it fails, measuring how water moves around a hull, and taking an engine apart to see why it turns. Every course with a sessional attached is taught in one of these rooms, and what follows is what each of them holds.';

const FEATURES = [
  {
    title: 'Built for ships',
    iconName: 'Ship',
    description:
      'Hydraulics, structures and marine engines — the three things a hull has to survive — each have a laboratory of their own.',
  },
  {
    title: 'Hands on the equipment',
    iconName: 'Wrench',
    description:
      'Lathes, welding sets and testing machines are operated by students, not demonstrated to them.',
  },
  {
    title: 'Supervised throughout',
    iconName: 'ShieldCheck',
    description:
      'Every laboratory is staffed by a lab officer and an attendant, and workshop sessions run under protective equipment.',
  },
];

async function main() {
  const workbook = XLSX.read(readFileSync(xlsxPath));
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    workbook.Sheets['Laboratory_Information'],
    { defval: '' },
  );

  const landing = await prisma.laboratoryFacilityLanding.update({
    where: { id: 'singleton' },
    data: {
      heroTitle: 'Laboratory Facility',
      heroOverline: 'About',
      introBody: INTRO,
      featuresOverline: 'What Sets Us Apart',
      featuresHeading: 'Why Our Laboratories Matter',
      features: FEATURES,
    },
  });
  console.log('landing :', landing.heroTitle, '·', FEATURES.length, 'features\n');

  /* Replaced wholesale: these cards have no key of their own beyond their
     order, so a partial update would leave the page describing a mixture of
     two spreadsheets. */
  await prisma.laboratoryLab.deleteMany();

  let order = 0;

  for (const row of rows) {
    const name = text(row[COLUMN.name]);
    if (!name) continue;
    order += 1;

    const equipment = sentenceList(text(row[COLUMN.equipment]));
    const software = sentenceList(text(row[COLUMN.software]));
    const courses = sentenceList(text(row[COLUMN.courses]));

    await prisma.laboratoryLab.create({
      data: {
        iconName: iconFor(name),
        title: name,
        description: text(row[COLUMN.purpose]),
        keyLabel: 'Key Equipment',
        keyItems: equipment || '—',
        focus: courses || '—',
        displayOrder: order,
        location: text(row[COLUMN.room]) || null,
        capacity: text(row[COLUMN.capacity]) || null,
        equipmentCount: text(row[COLUMN.count]) || null,
        software: software || null,
        inCharge: tidyInCharge(text(row[COLUMN.inCharge])) || null,
        safety: text(row[COLUMN.safety]) || null,
      },
    });

    const has = [
      text(row[COLUMN.room]) && 'location',
      text(row[COLUMN.capacity]) && 'capacity',
      text(row[COLUMN.count]) && 'count',
      software && 'software',
      text(row[COLUMN.inCharge]) && 'in-charge',
      text(row[COLUMN.safety]) && 'safety',
    ].filter(Boolean);

    console.log(`${String(order).padStart(2)}. ${name}`);
    console.log(`    ${has.join(' · ') || 'no extra detail'}`);
  }

  console.log(`\n${order} laboratories`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
