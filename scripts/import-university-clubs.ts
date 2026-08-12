/**
 * Copies the university's student clubs from the Mechanical Engineering site.
 *
 *   ME_DATABASE_URL=<connection string> \
 *     npx tsx --env-file=.env scripts/import-university-clubs.ts
 *
 * The debating, cultural, sports and similar clubs belong to Sonargaon
 * University, not to whichever department's site happens to list them, so
 * they read correctly here as written.
 *
 * The Mecha Club is not a university club — it is Mechanical Engineering's
 * own society — but it is listed here at the department's request, as one of
 * the societies a Sonargaon student can join. Its description says it
 * represents the Mechanical Engineering department, which is true, so the
 * usual renaming is not applied to it: rewriting that line would turn a fact
 * into a claim this department has a club it does not. See KEEP_WORDING.
 *
 * The department's own club leads the list; the rest follow in the order the
 * source keeps them.
 *
 * Every picture is a bundled file that the template already left in
 * public/assets, so nothing is uploaded. A club whose picture is missing is
 * reported and skipped rather than published with a broken image.
 *
 * Keyed by slug, so re-running updates in place.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { DepartmentRenamer, sourceDatabaseUrl } from './department-rename';

const prisma = new PrismaClient();
const source = new PrismaClient({ datasourceUrl: sourceDatabaseUrl() });
const rename = new DepartmentRenamer();

/**
 * Clubs whose own text names the department they belong to. That naming is
 * correct and must survive the copy — the renamer exists for text that would
 * be wrong on this site, not for text that is simply about someone else.
 */
const KEEP_WORDING = new Set(['sumec']);

/**
 * The source points this one at a picture in its own Cloudinary folder. The
 * same file is bundled here, and a local copy does not break if that folder
 * is ever tidied up.
 */
const LOCAL_PICTURE: Record<string, string> = {
  design: '/assets/clubs/design.webp',
};

/** This department's own club stays at the top of the page. */
const OWN_CLUB_SLUG = 'su-name-club';

async function main() {
  const clubs = await source.club.findMany({ orderBy: { displayOrder: 'asc' } });

  const own = await prisma.club.findUnique({ where: { slug: OWN_CLUB_SLUG } });
  if (own) await prisma.club.update({ where: { slug: OWN_CLUB_SLUG }, data: { displayOrder: 0 } });

  let order = 1;
  const skipped: string[] = [];

  for (const club of clubs) {
    const imageUrl = LOCAL_PICTURE[club.slug] ?? club.imageUrl;
    if (imageUrl.startsWith('/') && !existsSync(path.join(process.cwd(), 'public', imageUrl))) {
      skipped.push(`${club.name} — ${imageUrl} is not in public/assets`);
      continue;
    }

    const asWritten = KEEP_WORDING.has(club.slug);
    const text = (value: string) => (asWritten ? value : rename.text(value));

    const data = {
      name: text(club.name),
      abbreviation: text(club.abbreviation),
      description: text(club.description),
      imageUrl,
      imagePublicId: LOCAL_PICTURE[club.slug] ? null : club.imagePublicId,
      displayOrder: order,
    };

    await prisma.club.upsert({
      where: { slug: club.slug },
      create: { slug: club.slug, ...data },
      update: data,
    });
    console.log(`  ${order}. ${data.name}${asWritten ? '  (wording kept as written)' : ''}`);
    order += 1;
  }

  console.log(`\nClubs imported: ${order - 1}`);
  if (own) console.log(`  ${own.name} keeps the top of the list`);
  if (skipped.length > 0) {
    console.log(`  left behind: ${skipped.length}`);
    for (const s of skipped) console.log(`    ${s}`);
  }
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
