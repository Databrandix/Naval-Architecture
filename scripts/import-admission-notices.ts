/**
 * Copies the admission notices from the Mechanical Engineering site.
 *
 * These are Office of the Registrar circulars addressed to every faculty and
 * department at once — an admission fair inauguration, not departmental
 * business — so they read correctly here without alteration. A notice that
 * genuinely belonged to one department would not be copied; it would be
 * wrong on this site no matter how the wording were patched.
 *
 * This is a holding measure until this department issues its own notices.
 * Both the hero image and the attached PDF are bundled files rather than
 * uploads, and both are already present in public/assets.
 *
 *   ME_DATABASE_URL=<connection string> \
 *     npx tsx --env-file=.env scripts/import-admission-notices.ts
 *
 * Keyed by slug, so re-running updates in place.
 */

import { PrismaClient } from '@prisma/client';
import { DepartmentRenamer, sourceDatabaseUrl } from './department-rename';

const prisma = new PrismaClient();
const source = new PrismaClient({ datasourceUrl: sourceDatabaseUrl() });
const rename = new DepartmentRenamer();

async function main() {
  const notices = await source.admissionNotice.findMany({
    orderBy: { publishedAt: 'desc' },
  });

  if (notices.length === 0) {
    throw new Error('The source database has no admission notices.');
  }

  for (const n of notices) {
    const data = {
      title: rename.text(n.title),
      refNo: n.refNo,
      subject: rename.text(n.subject),
      publishedAt: n.publishedAt,
      displayDate: n.displayDate,
      headerOverline: n.headerOverline,
      bodyParagraphs: rename.deep(n.bodyParagraphs) as never,
      signatoryPreamble: n.signatoryPreamble,
      signatoryName: n.signatoryName,
      signatoryDesignation: n.signatoryDesignation,
      ccLabel: n.ccLabel,
      ccList: rename.deep(n.ccList) as never,
      heroImageUrl: n.heroImageUrl,
      heroImagePublicId: n.heroImagePublicId,
      fileUrl: n.fileUrl,
      filePublicId: n.filePublicId,
      fileName: n.fileName,
      isActive: n.isActive,
      displayOrder: n.displayOrder,
    };
    await prisma.admissionNotice.upsert({
      where: { slug: n.slug },
      create: { slug: n.slug, ...data },
      update: data,
    });
    console.log(`  ${n.refNo} — ${data.title}`);
  }

  console.log(`Admission notices imported: ${notices.length}`);
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
