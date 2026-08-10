/**
 * Adds the waivers granted by the Fall-2026 fee schedule to the waiver page.
 *
 * Two waivers are approved on the Board of Trustees fee schedule rather than
 * by the Student Welfare Division, so they are absent from the waiver policy
 * this site imported from a sibling department: the Golden A+ tuition waiver
 * and the discounts for paying in advance. A student looking for what they
 * can claim goes to the waiver page, not to a fee table, so both belong
 * here as well — worded to match /programs/bsc-name so the two pages cannot
 * drift into contradicting each other.
 *
 * The department's own 27% entry waiver rides along in the same card. It is
 * a fee-table figure, but it is also the largest waiver most applicants to
 * this programme will receive, and a waiver page that omits it is misleading
 * by silence.
 *
 * Run after scripts/import-waiver-scholarship.ts, which owns the rows copied
 * from the sibling department and rewrites the summary table wholesale:
 *
 *   npx tsx --env-file=.env scripts/seed-fee-schedule-waivers.ts
 *
 * Safe to run repeatedly, and safe to re-run after another import — cards
 * are keyed by slug and summary rows are matched by category name.
 *
 * Source: Sonargaon University, Fall-2026 fee schedule (undergraduate,
 * bi-semester), effective 24 April 2026, approved by the Board of Trustees.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Appended after the four imported cards rather than renumbered in front of
 *  them, so re-importing those cards cannot disturb this ordering. */
const CATEGORIES = [
  {
    slug: 'academic-merit-entry',
    iconName: 'Medal',
    title: 'Academic Merit at Entry',
    displayOrder: 4,
    items: [
      {
        heading: 'Golden A+ in SSC and HSC / Diploma',
        text: 'A 100% waiver on tuition fees. Applies to undergraduate programmes; LLB and postgraduate programmes are excluded.',
      },
      {
        heading: 'Programme Entry Waiver (NAME)',
        text: 'A 27% waiver on the per-credit tuition fee — BDT 525 reduced to BDT 383 — for applicants with SSC and HSC GPA 5.00–10.00, or SSC and Diploma GPA 5.00–9.00.',
      },
    ],
    note: 'The entry waiver is already reflected in the totals on the tuition fee page; it is not applied a second time on top of them.',
  },
  {
    slug: 'advance-payment',
    iconName: 'Percent',
    title: 'Advance Payment Waivers',
    displayOrder: 5,
    items: [
      {
        heading: 'Full First Semester at Admission',
        text: '10% waiver on tuition fees when the entire first semester fee is paid at the time of admission.',
      },
      {
        heading: 'Full Programme Fee at Admission',
        text: '15% waiver on tuition fees when the entire programme fee is paid at the time of admission.',
      },
    ],
    note: null,
  },
];

/** Rows for the quick-reference table under Part 01. */
const SUMMARY_ROWS = [
  { category: 'Golden A+ (SSC & HSC / Diploma)', max: '100% (Tuition)', status: 'Active' },
  { category: 'Programme Entry Waiver (NAME)', max: '27% per credit', status: 'Active' },
  { category: 'Advance Payment', max: '10% – 15%', status: 'Active' },
];

type SummaryRow = { category: string; max: string; status: string };

function isSummaryRow(v: unknown): v is SummaryRow {
  return !!v && typeof v === 'object' && typeof (v as SummaryRow).category === 'string';
}

async function main() {
  for (const { slug, ...rest } of CATEGORIES) {
    const data = { ...rest, items: rest.items as never };
    await prisma.waiverCategory.upsert({
      where: { slug },
      create: { slug, ...data },
      update: data,
    });
  }

  const landing = await prisma.waiverScholarshipLanding.findUnique({
    where: { id: 'singleton' },
  });
  if (!landing) {
    throw new Error(
      'No waiver_scholarship_landing row — run scripts/import-waiver-scholarship.ts first.',
    );
  }

  const existing = Array.isArray(landing.summaryRows)
    ? (landing.summaryRows as unknown[]).filter(isSummaryRow)
    : [];

  // Match on category so a second run updates the figures in place instead of
  // appending a near-duplicate row beneath the original.
  const merged = [...existing];
  let added = 0;
  for (const row of SUMMARY_ROWS) {
    const at = merged.findIndex((r) => r.category === row.category);
    if (at === -1) {
      merged.push(row);
      added += 1;
    } else {
      merged[at] = row;
    }
  }

  await prisma.waiverScholarshipLanding.update({
    where: { id: 'singleton' },
    data: { summaryRows: merged as never },
  });

  console.log('Fee schedule waivers seeded.');
  console.log(`  cards:       ${CATEGORIES.length}`);
  console.log(`  summary:     ${merged.length} rows (${added} added, ${SUMMARY_ROWS.length - added} updated)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
