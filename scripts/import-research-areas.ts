/**
 * The homepage's "Major Research Area" section.
 *
 *   npx tsx --env-file=.env scripts/import-research-areas.ts [featured image path]
 *
 * Six areas and one featured card. The areas are not invented: each is drawn
 * from what the department already says about itself — the overview's list of
 * focus areas, the head's stated research interests, and the courses the
 * curriculum actually teaches. A research area nobody in the department works
 * on is a claim the first visiting assessor will check.
 *
 * Safe to run again: it replaces the set. Pass an image path to upload a new
 * featured picture; leave it out to keep the one already there.
 */
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

const [, , featuredImagePath] = process.argv;

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const AREAS = [
  {
    iconName: 'Ship',
    areaName: 'Ship Design and Construction',
    description:
      'Hull form, hydrostatics and stability, general arrangement and the drawings a yard builds from — the work the programme is built around, from Basic Naval Architecture in the first semester to the final-year design project.',
  },
  {
    iconName: 'Waves',
    areaName: 'Marine Hydrodynamics',
    description:
      'Resistance and propulsion, seakeeping and flow around the hull, studied on the hydraulic flume and in computational fluid dynamics.',
  },
  {
    iconName: 'Frame',
    areaName: 'Marine Structures',
    description:
      'Strength of the hull girder, plate and stiffener behaviour, vibration and fatigue, analysed by finite element method and tested to failure in the solid mechanics laboratory.',
  },
  {
    iconName: 'Cog',
    areaName: 'Marine and Offshore Engineering',
    description:
      'Propulsion machinery, marine engines and the systems that keep a vessel running, extending to offshore structures and the equipment they carry.',
  },
  {
    iconName: 'Factory',
    areaName: 'Shipbuilding Technology and Shipyard Management',
    description:
      'Production methods, welding and fabrication, materials, and the planning and management of a yard — the subject of a large part of the department’s consultancy work.',
  },
  {
    iconName: 'ShieldCheck',
    areaName: 'Maritime Safety, Risk and Operations',
    description:
      'Risk analysis and safety management, shipping and port operations, fleet and cargo management, and the regulations that govern them.',
  },
];

const FEATURED = {
  heading: 'Working with the shipbuilding industry',
  description:
    'Faculty and students at the marine and shipbuilding exhibition, alongside the yards and engine builders the department’s graduates go on to work for.',
  ctaHref: '/research',
};

async function uploadFeatured(path: string) {
  const uploaded = await cloudinary.uploader.upload(
    `data:image/jpeg;base64,${readFileSync(path).toString('base64')}`,
    {
      folder: `${process.env.CLOUDINARY_UPLOAD_FOLDER}/research-areas`,
      public_id: 'featured-industry',
      overwrite: true,
    },
  );
  return { url: uploaded.secure_url, publicId: uploaded.public_id, width: uploaded.width, height: uploaded.height };
}

async function main() {
  /* Keep the current picture when no new one is given, so re-running to edit
     the wording does not blank the featured card. */
  const existing = await prisma.researchArea.findFirst({
    where: { isFeatured: true },
    select: { featuredImageUrl: true, featuredImagePublicId: true },
  });

  const picture = featuredImagePath
    ? await uploadFeatured(featuredImagePath)
    : { url: existing?.featuredImageUrl ?? null, publicId: existing?.featuredImagePublicId ?? null, width: 0, height: 0 };

  if (featuredImagePath) console.log(`featured image: ${picture.width}×${picture.height}`);

  await prisma.researchArea.deleteMany();

  for (const [index, area] of AREAS.entries()) {
    /* The first area carries the featured card. The section looks for whichever
       row is flagged, and exactly one should be. */
    const isFeatured = index === 0;

    await prisma.researchArea.create({
      data: {
        ...area,
        displayOrder: index + 1,
        isFeatured,
        ...(isFeatured
          ? {
              featuredHeading: FEATURED.heading,
              featuredDescription: FEATURED.description,
              featuredCtaHref: FEATURED.ctaHref,
              featuredImageUrl: picture.url,
              featuredImagePublicId: picture.publicId,
            }
          : {}),
      },
    });

    console.log(`${isFeatured ? '★' : ' '} ${area.areaName}`);
  }

  console.log(`\n${AREAS.length} research areas · featured: ${FEATURED.heading}`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
