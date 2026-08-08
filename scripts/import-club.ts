/**
 * The department's student club: the /about/club page and its entry in the
 * club list.
 *
 *   npx tsx --env-file=.env scripts/import-club.ts <xlsx path>
 *
 * Read from the department's "Student Societies and Co-Curricular"
 * spreadsheet. The club is new — founded in 2025, with one workshop run so
 * far — so the page says what it is for and what it has done, and the counters
 * across the top report facts from the sheet rather than the round numbers a
 * long-established club would show. "100+ members" on a club with no membership
 * figure in its own file is the kind of claim a visitor checks.
 */
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const [, , xlsxPath] = process.argv;
if (!xlsxPath) {
  console.error('usage: npx tsx --env-file=.env scripts/import-club.ts <xlsx path>');
  process.exit(1);
}

const prisma = new PrismaClient();

const text = (v: unknown): string => String(v ?? '').replace(/\r/g, '').trim();

/** "1. Sheikh Abid Ibn Shahed\n(Lecturer & Coordinator)\n2. …" → readable names. */
function advisorNames(raw: string): string[] {
  return raw
    .split(/\n(?=\d+\.)|(?<=\))\s*\n/)
    .map((entry) => entry.replace(/^\d+\.\s*/, '').replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);
}

/** The purpose paragraph, before the numbered objectives that follow it. */
function purposeParagraph(raw: string): string {
  const body = raw.replace(/^Purpose of[^\n]*\n+/i, '');
  const [purpose] = body.split(/\n+Objectives of/i);
  return purpose.trim();
}

function objectives(raw: string): string[] {
  const [, list] = raw.split(/\n+Objectives of[^\n]*\n+/i);
  if (!list) return [];
  return list
    .split(/\n+(?=\d+\.)/)
    .map((line) => line.replace(/^\d+\.\s*/, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/** An objective becomes an activity card; the icon follows what it describes. */
function iconFor(objective: string): string {
  if (/seminar|workshop|training/i.test(objective)) return 'Presentation';
  if (/research|innovation|project/i.test(objective)) return 'Lightbulb';
  if (/network|organi[sz]ation|alumni/i.test(objective)) return 'Users';
  return 'GraduationCap';
}

function categoryFor(objective: string): string {
  if (/seminar|workshop|training/i.test(objective)) return 'Events & Training';
  if (/research|innovation|project/i.test(objective)) return 'Research';
  if (/network|organi[sz]ation|alumni/i.test(objective)) return 'Professional Network';
  return 'Academic';
}

function titleFor(objective: string): string {
  if (/seminar|workshop|training/i.test(objective)) return 'Seminars, Workshops and Training';
  if (/research|innovation|project/i.test(objective)) return 'Research, Innovation and Technical Projects';
  if (/network|organi[sz]ation|alumni/i.test(objective)) return 'Professional Networks';
  return 'Knowledge and Skills in Naval Architecture';
}

async function main() {
  const workbook = XLSX.read(readFileSync(xlsxPath));
  const club = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    workbook.Sheets['Societies_Clubs'],
    { defval: '' },
  )[0];
  const activityRows = XLSX.utils
    .sheet_to_json<Record<string, unknown>>(workbook.Sheets['Activities_Events'], { defval: '' })
    .filter((row) => text(row['Event/Activity Name']));

  const name = text(club['Society/Club Name']);
  const purposeRaw = text(club['Purpose & Objectives']);
  const purpose = purposeParagraph(purposeRaw);
  const objectiveList = objectives(purposeRaw);
  const advisors = advisorNames(text(club['Advisor (Faculty)']));
  const founded = text(club['Founded Year']);
  const facebook = text(club['Website/Facebook Link']);

  /* Counters that are true today: the year it started, how many advisors it
     has, how many objectives it set itself, and what it has actually run. */
  const stats = [
    { label: 'Founded', value: founded || '—' },
    { label: 'Faculty Advisors', value: String(advisors.length) },
    { label: 'Objectives', value: String(objectiveList.length) },
    { label: 'Activities Held', value: String(activityRows.length) },
  ];

  const activities = objectiveList.map((objective) => ({
    title: titleFor(objective),
    category: categoryFor(objective),
    iconName: iconFor(objective),
    description: objective,
  }));

  const advisorLine =
    advisors.length > 0
      ? `The club is advised by ${advisors.join(' and ')}, with ${text(club['President/Lead (Student)'])} leading it as student president.`
      : '';

  const workshop = activityRows[0];
  const workshopLine = workshop
    ? `Its first activity was the ${text(workshop['Event/Activity Name'])} — ${text(workshop['Brief Summary'])}`
    : '';

  await prisma.aboutDepartmentClub.update({
    where: { id: 'singleton' },
    data: {
      heroTitle: name,
      heroOverline: 'About',
      introHeading: `Naval Architects and Marine Engineers <span>in the Making</span>`,
      introBody1: purpose,
      introBody2: [advisorLine, workshopLine].filter(Boolean).join(' '),
      stats,
      activitiesOverline: 'What the club does',
      activitiesHeading: 'Objectives',
      activities,
      networkOverline: 'Beyond the campus',
      networkHeading: 'Building a Professional Network',
      networkBody:
        'The club works towards links with the bodies its members will meet in professional life — IMO, IMarEST, RINA, SNAME and ANAMEB — alongside shipyards, design firms, other university clubs, and the department’s own alumni.',
      networkPrimaryCtaLabel: 'Join the Club',
      networkPrimaryCtaHref: '#join',
      ...(facebook ? { networkSecondaryCtaLabel: 'Follow on Facebook', networkSecondaryCtaHref: facebook } : {}),
    },
  });

  /* The same club in the club list at /student-society/club-list. That model
     requires a picture; the club's own workshop, already uploaded with the
     events, is the only photograph of it there is. */
  const workshopEvent = workshop
    ? await prisma.event.findFirst({
        where: { title: { contains: text(workshop['Event/Activity Name']), mode: 'insensitive' } },
        select: { imageUrl: true, imagePublicId: true },
      })
    : null;

  const departmentLogo = await prisma.departmentIdentity.findUnique({
    where: { id: 'singleton' },
    select: { logoUrl: true },
  });

  const slug = 'su-name-club';
  const listEntry = {
    name,
    abbreviation: 'SU NAME Club',
    description: purpose,
    imageUrl: workshopEvent?.imageUrl ?? departmentLogo?.logoUrl ?? '/assets/hero-1.webp',
    imagePublicId: workshopEvent?.imagePublicId ?? null,
    displayOrder: 1,
  };
  await prisma.club.upsert({ where: { slug }, update: listEntry, create: { slug, ...listEntry } });

  console.log(name);
  console.log(`  founded      ${founded}, ${text(club['Status (Active/Inactive)']).toLowerCase()}`);
  console.log(`  advisors     ${advisors.join(' · ')}`);
  console.log(`  president    ${text(club['President/Lead (Student)'])}`);
  console.log(`  objectives   ${objectiveList.length}`);
  console.log(`  activities   ${activityRows.length}`);
  console.log(`  facebook     ${facebook || '—'}`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
