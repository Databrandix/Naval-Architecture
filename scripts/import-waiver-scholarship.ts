/**
 * Copies the waiver and merit-scholarship policy from the Mechanical
 * Engineering site — the page chrome, the waiver category cards, and the
 * scholarship slabs.
 *
 * Waivers are awarded by the Student Welfare Division against university
 * criteria — family, quota, staff relation, credit load, GPA — none of which
 * vary by department. One clause names departments directly: the group waiver
 * pays 5% for pairs in Architecture, Naval Architecture, and Journalism where
 * general programmes need three or more. That clause is about this department,
 * so it is copied as written rather than renamed.
 *
 * Rows are keyed by slug, so re-running updates in place instead of
 * accumulating duplicates.
 *
 *   ME_DATABASE_URL=<connection string> \
 *     npx tsx --env-file=.env scripts/import-waiver-scholarship.ts
 */

import { PrismaClient } from '@prisma/client';
import { DepartmentRenamer, sourceDatabaseUrl } from './department-rename';

const prisma = new PrismaClient();
const source = new PrismaClient({ datasourceUrl: sourceDatabaseUrl() });
const rename = new DepartmentRenamer();

async function main() {
  const [landing, categories, scholarships] = await Promise.all([
    source.waiverScholarshipLanding.findUnique({ where: { id: 'singleton' } }),
    source.waiverCategory.findMany({ orderBy: { displayOrder: 'asc' } }),
    source.scholarship.findMany({ orderBy: { displayOrder: 'asc' } }),
  ]);

  if (!landing) {
    throw new Error('The source database has no waiver_scholarship_landing row.');
  }

  const landingData = {
    intro: rename.text(landing.intro),
    part1Kicker: rename.text(landing.part1Kicker),
    part1Heading: rename.text(landing.part1Heading),
    summaryHeading: rename.text(landing.summaryHeading),
    summarySubheading: rename.text(landing.summarySubheading),
    summaryRows: rename.deep(landing.summaryRows) as never,
    summaryFooterNote: rename.text(landing.summaryFooterNote),
    part2Kicker: rename.text(landing.part2Kicker),
    part2Heading: rename.text(landing.part2Heading),
    part2Intro: rename.text(landing.part2Intro),
    keyTakeawaysKicker: rename.text(landing.keyTakeawaysKicker),
    keyTakeaways: rename.deep(landing.keyTakeaways) as never,
  };

  await prisma.waiverScholarshipLanding.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...landingData },
    update: landingData,
  });

  for (const c of categories) {
    const data = {
      iconName: c.iconName,
      title: rename.text(c.title),
      items: rename.deep(c.items) as never,
      note: c.note === null ? null : rename.text(c.note),
      displayOrder: c.displayOrder,
    };
    await prisma.waiverCategory.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, ...data },
      update: data,
    });
  }

  for (const s of scholarships) {
    const data = {
      name: rename.text(s.name),
      credits: rename.text(s.credits),
      base: rename.text(s.base),
      perfect: rename.text(s.perfect),
      near: rename.text(s.near),
      isHighlight: s.isHighlight,
      displayOrder: s.displayOrder,
    };
    await prisma.scholarship.upsert({
      where: { slug: s.slug },
      create: { slug: s.slug, ...data },
      update: data,
    });
  }

  console.log('Waiver and scholarship policy imported.');
  console.log(`  summary rows:      ${(landingData.summaryRows as unknown[]).length}`);
  console.log(`  waiver categories: ${categories.length}`);
  console.log(`  scholarship slabs: ${scholarships.length}`);
  rename.report();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.all([prisma.$disconnect(), source.$disconnect()]);
  });
