/**
 * The photo gallery.
 *
 *   npx tsx --env-file=.env scripts/import-gallery.ts "C:\naval architecture file"
 *
 * Every photograph the department supplied, uploaded to Cloudinary and
 * ordered so the page reads as a year in the department's life: the
 * freshers' reception, the seminars, the workshops, the yard visits, the
 * competitions, then the club's own occasions.
 *
 * Two of the supplied files are deliberately absent. The department crest is
 * a logo and the seminar write-up is a newspaper column — in a masonry grid
 * of photographs the first looks like a stray icon and the second like a
 * wall of unreadable type. Both are listed under EXCLUDED below; move a line
 * up into PHOTOS to publish it.
 *
 * Alt text describes what is visible and nothing more. Where a face is not
 * identifiable from the photograph itself, the caption says "a guest" or "a
 * speaker" rather than guessing at a name — a wrong name in alt text is read
 * aloud to the people who most depend on it being right.
 *
 * Safe to run again: rows are replaced wholesale and uploads overwrite by
 * public id, so re-running does not accumulate duplicates.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

const [, , rootArg] = process.argv;
const ROOT = rootArg ?? 'C:\\naval architecture file';
if (!existsSync(ROOT)) {
  console.error(`No such folder: ${ROOT}`);
  process.exit(1);
}

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const EVENTS = 'events and news image';
const FRESHERS = `${EVENTS}\\Freshers’ Reception for Fall 2025`;
const CAREER = `${EVENTS}\\Seminar on Career Opportunities and Professional Pathways`;
const AUTOCAD = `${EVENTS}\\AutoCAD Basic & Ship Design Workshop`;
const TRAINING = `${EVENTS}\\Industrial Training of NAME Department`;

type Photo = { file: string; id: string; alt: string };

const PHOTOS: Photo[] = [
  // ── Freshers' Reception, Fall 2025 ──────────────────────────────
  {
    file: `${FRESHERS}\\IMGL6704.JPG`,
    id: 'freshers-reception-welcome',
    alt: 'Students and teachers gathered beneath the Welcome Onboard banner at the Freshers’ Reception for Fall 2025',
  },
  {
    file: `${FRESHERS}\\IMGL6403.JPG`,
    id: 'freshers-reception-stage',
    alt: 'Guests seated on stage as the Freshers’ Reception for Fall 2025 opens',
  },
  {
    file: `${FRESHERS}\\IMGL6465.JPG`,
    id: 'freshers-reception-bouquet',
    alt: 'A bouquet presented to a guest at the Freshers’ Reception',
  },
  {
    file: '530848232_1185169990293497_5226121870150286989_n.jpg',
    id: 'freshers-reception-bouquet-wide',
    alt: 'A bouquet handed to a guest at the head table of the Freshers’ Reception',
  },
  {
    file: `${FRESHERS}\\IMGL6542.JPG`,
    id: 'freshers-reception-crest-one',
    alt: 'A crest presented to a guest at the Freshers’ Reception for Fall 2025',
  },
  {
    file: `${FRESHERS}\\IMGL6563.JPG`,
    id: 'freshers-reception-crest-two',
    alt: 'A crest handed over between guests at the Freshers’ Reception',
  },
  {
    file: `${FRESHERS}\\IMGL6567.JPG`,
    id: 'freshers-reception-crest-three',
    alt: 'A crest presented as colleagues look on at the Freshers’ Reception',
  },
  {
    file: `${FRESHERS}\\IMGL6669.JPG`,
    id: 'freshers-reception-head-table',
    alt: 'Guests at the head table during the Freshers’ Reception for Fall 2025',
  },
  {
    file: `${FRESHERS}\\IMGL6701.JPG`,
    id: 'freshers-reception-group',
    alt: 'Group photograph of guests and students at the Freshers’ Reception for Fall 2025',
  },
  {
    file: '529941193_122149797974752438_6773240170731144828_n.jpg',
    id: 'freshers-reception-hall',
    alt: 'Guests and students assembled in the decorated hall at the Freshers’ Reception',
  },
  {
    file: '530482827_1185169743626855_3829106220324651271_n.jpg',
    id: 'freshers-reception-banner',
    alt: 'Students and teachers beneath the Freshers’ Reception banner',
  },

  // ── Seminar on career opportunities ─────────────────────────────
  {
    file: `${CAREER}\\IMGL7489.JPG`,
    id: 'career-seminar-head-table',
    alt: 'The head table at the seminar on career opportunities and professional pathways for naval architects and marine engineers',
  },
  {
    file: `${CAREER}\\IMGL7483.JPG`,
    id: 'career-seminar-audience',
    alt: 'Students in the audience at the seminar on career opportunities for naval architects and marine engineers',
  },
  {
    file: `${CAREER}\\IMGL7549.JPG`,
    id: 'career-seminar-speaker-one',
    alt: 'A speaker addresses the seminar on career opportunities',
  },
  {
    file: `${CAREER}\\IMGL7552.JPG`,
    id: 'career-seminar-speaker-two',
    alt: 'A speaker at the podium during the seminar on career opportunities',
  },
  {
    file: `${CAREER}\\IMGL7583.JPG`,
    id: 'career-seminar-speaker-three',
    alt: 'A guest speaker addresses students at the seminar on career opportunities',
  },
  {
    file: `${CAREER}\\IMGL7629.JPG`,
    id: 'career-seminar-speaker-four',
    alt: 'A guest speaker takes questions at the seminar on career opportunities',
  },
  {
    file: `${CAREER}\\IMGL7649.JPG`,
    id: 'career-seminar-speaker-five',
    alt: 'A speaker at the podium at the seminar on career opportunities',
  },
  {
    file: '540722974_1092598083087405_2332950786175739494_n.jpg',
    id: 'career-seminar-crest',
    alt: 'A crest presented to a guest at the seminar on career opportunities and professional pathways',
  },
  {
    file: '541534389_1092602379753642_6918206890447995192_n.jpg',
    id: 'career-seminar-group',
    alt: 'Students and guests together at the close of the seminar on career opportunities',
  },

  // ── AutoCAD and ship design workshop ────────────────────────────
  {
    file: `${AUTOCAD}\\WhatsApp Image 2026-07-28 at 8.32.47 PM.jpeg`,
    id: 'autocad-workshop-drawing',
    alt: 'An instructor works through a ship-design drawing at the AutoCAD Basic and Ship Design workshop',
  },
  {
    file: `${AUTOCAD}\\WhatsApp Image 2026-07-28 at 8.32.53 PM.jpeg`,
    id: 'autocad-workshop-workstations',
    alt: 'Students at their workstations during the AutoCAD Basic and Ship Design workshop',
  },
  {
    file: `${AUTOCAD}\\WhatsApp Image 2026-07-28 at 8.33.01 PM.jpeg`,
    id: 'autocad-workshop-lab',
    alt: 'The computer laboratory in session during the AutoCAD Basic and Ship Design workshop',
  },
  {
    file: `${AUTOCAD}\\WhatsApp Image 2026-08-07 at 6.51.20 PM.jpeg`,
    id: 'autocad-workshop-participants',
    alt: 'Participants of the AutoCAD Basic and Ship Design workshop in the computer laboratory',
  },
  {
    file: `${AUTOCAD}\\WhatsApp Image 2026-08-07 at 6.51.21 PM.jpeg`,
    id: 'autocad-workshop-closing',
    alt: 'Participants gathered at the close of the AutoCAD Basic and Ship Design workshop',
  },

  // ── Industrial training and yard visits ─────────────────────────
  {
    file: `${TRAINING}\\20241004_182252.jpg`,
    id: 'industrial-training-testing-machine',
    alt: 'A technician demonstrates a testing machine to students during industrial training',
  },
  {
    file: `${TRAINING}\\WhatsApp Image 2024-11-02 at 15.04.56_02a499b6.jpg`,
    id: 'industrial-training-assembly-hall',
    alt: 'Students inside an assembly hall during a yard visit',
  },
  {
    file: `${TRAINING}\\WhatsApp Image 2024-11-02 at 15.04.57_0ca888a2.jpg`,
    id: 'industrial-training-briefing',
    alt: 'A Dockyard and Engineering Works engineer briefs students at the start of a yard visit',
  },
  {
    file: `${TRAINING}\\WhatsApp Image 2024-11-02 at 15.04.57_728e811e.jpg`,
    id: 'industrial-training-workshop',
    alt: 'Students outside a shipyard workshop during industrial training',
  },
  {
    file: `${TRAINING}\\WhatsApp Image 2026-04-30 at 10.58.16 AM.jpeg`,
    id: 'industrial-training-gearbox',
    alt: 'Students examine a stripped marine gearbox during industrial training',
  },
  {
    file: `${TRAINING}\\WhatsApp Image 2026-05-21 at 7.45.42 PM.jpeg`,
    id: 'industrial-training-gate',
    alt: 'Students at the gate of Dockyard and Engineering Works Ltd.',
  },
  {
    file: '30-10-2021_1635579469.jpg',
    id: 'shipyard-training-certificates',
    alt: 'The certificate handover ceremony for the department’s shipyard training programme',
  },
  {
    file: '485062994_1074351681375329_3680086085072878535_n.jpg',
    id: 'quayside-lift',
    alt: 'Workers watch a crane lift a large cylindrical unit at a quayside beside a ship',
  },
  {
    file: '485033469_1074351794708651_2040173597279775514_n.jpg',
    id: 'engine-room-purifiers',
    alt: 'Fuel and lubricating oil purifiers in a ship’s engine room',
  },
  {
    file: 's_6.jpg',
    id: 'patrol-craft-handover',
    alt: 'Newly built patrol craft decorated for a handover ceremony',
  },

  // ── Maritime trade exhibition ───────────────────────────────────
  {
    file: '576731393_1146426827704530_5511335371081012798_n.jpg',
    id: 'exhibition-marine-house',
    alt: 'Faculty and students at the Marine House stand during a maritime trade exhibition',
  },
  {
    file: '576546788_1146426591037887_2777761523246265566_n.jpg',
    id: 'exhibition-shipdyn',
    alt: 'At the ShipDyn Ltd. stand during a maritime trade exhibition',
  },
  {
    file: '573605095_1146426784371201_1207155593833561314_n.jpg',
    id: 'exhibition-stands',
    alt: 'Faculty and students visiting exhibitor stands at a maritime trade exhibition',
  },

  // ── Competitions ────────────────────────────────────────────────
  {
    file: '622877124_1323084823168679_9200052223555369029_n.jpg',
    id: 'name-fest-mist',
    alt: 'The department’s team outside the Military Institute of Science and Technology for NAME Fest',
  },
  {
    file: '619989774_1322901156520379_8842420251632783819_n.jpg',
    id: 'competition-certificate',
    alt: 'A student with a certificate won at an inter-university competition',
  },
  {
    file: 'ChatGPT Image Aug 9, 2026, 03_42_59 PM.png',
    id: 'navarch-quiz-result',
    alt: 'The NavArch quiz competition result announced at NAME Fest 2025',
  },

  // ── Club occasions and campus life ──────────────────────────────
  {
    file: '648103570_1356750519802109_5102631854984502099_n.jpg',
    id: 'iftar-mahfil-speaker',
    alt: 'A speaker opens the department’s Ramadan iftar mahfil',
  },
  {
    file: '649204744_1356750369802124_4900962048055773086_n.jpg',
    id: 'iftar-mahfil-hall',
    alt: 'Students and teachers at the department’s Ramadan iftar mahfil',
  },
  {
    file: '647739921_1356750696468758_184449392636162689_n.jpg',
    id: 'iftar-mahfil-certificate-one',
    alt: 'A certificate presented at the department’s Ramadan iftar mahfil',
  },
  {
    file: '648025471_1356750596468768_4141998502695420162_n.jpg',
    id: 'iftar-mahfil-certificate-two',
    alt: 'A certificate presented to a student at the Ramadan iftar mahfil',
  },
  {
    file: '648091260_1356750873135407_2496534262572972832_n.jpg',
    id: 'iftar-mahfil-certificate-three',
    alt: 'Certificates handed to students at the Ramadan iftar mahfil',
  },
  {
    file: '649208916_1356750773135417_7463729603199801113_n.jpg',
    id: 'farewell-certificate',
    alt: 'A certificate presented at the department’s farewell programme',
  },
  {
    file: '495215449_122128927004752438_1134746263247625306_n.jpg',
    id: 'department-outing-tree',
    alt: 'Students and teachers on a departmental outing',
  },
  {
    file: 'name club.jpg',
    id: 'name-club-outing',
    alt: 'Members of the SU NAME Club on a departmental outing',
  },
  {
    file: '495539568_1002942482052966_1229019444229247559_n.jpg',
    id: 'department-office',
    alt: 'Students with a teacher in the departmental office',
  },
  {
    file: '476152447_584530944344877_6199609377842460950_n.jpg',
    id: 'department-gathering',
    alt: 'Students at a departmental gathering',
  },
];

/** Supplied, but not photographs — see the note at the top of this file. */
const EXCLUDED = [
  '529788393_1183230947154068_4139985607976020324_n.jpg', // department crest
  `${EVENTS}\\Seminar on Prospect of Employment\\Screenshot 2026-08-07 191805.png`, // press column
];

/**
 * Cloudinary's free plan refuses uploads over 10 MB and several of these are
 * 6720px camera originals. Nothing on the page is displayed above 2000px, so
 * every photograph is re-encoded to that width — well inside the limit, and a
 * gallery of fifty full-resolution frames would otherwise be a slow page.
 */
async function upload(filePath: string, publicId: string) {
  const sharp = (await import('sharp')).default;
  const resized = await sharp(readFileSync(filePath))
    .rotate()
    .resize({ width: 2000, withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();

  const uploaded = await cloudinary.uploader.upload(
    `data:image/jpeg;base64,${resized.toString('base64')}`,
    {
      folder: `${process.env.CLOUDINARY_UPLOAD_FOLDER}/gallery`,
      public_id: publicId,
      overwrite: true,
      /* These are camera originals over a domestic link; sixty seconds is
         not enough for one of them. */
      timeout: 120_000,
    },
  );
  return {
    url: uploaded.secure_url as string,
    publicId: uploaded.public_id as string,
    width: uploaded.width as number,
    height: uploaded.height as number,
  };
}

async function main() {
  const missing = [...PHOTOS.map((p) => p.file), ...EXCLUDED].filter(
    (f) => !existsSync(path.join(ROOT, f)),
  );
  if (missing.length > 0) {
    throw new Error(`Not found under ${ROOT}:\n  ${missing.join('\n  ')}`);
  }

  const rows: { imageUrl: string; imagePublicId: string; alt: string; width: number; height: number; displayOrder: number }[] = [];

  for (const [index, photo] of PHOTOS.entries()) {
    const uploaded = await upload(path.join(ROOT, photo.file), photo.id);
    rows.push({
      imageUrl: uploaded.url,
      imagePublicId: uploaded.publicId,
      alt: photo.alt,
      width: uploaded.width,
      height: uploaded.height,
      displayOrder: index,
    });
    console.log(`  ${String(index + 1).padStart(2, '0')}  ${uploaded.width}x${uploaded.height}  ${photo.id}`);
  }

  await prisma.$transaction([
    prisma.galleryImage.deleteMany({}),
    prisma.galleryImage.createMany({ data: rows }),
  ]);

  console.log(`\nGallery imported: ${rows.length} photographs.`);
  console.log(`Left out (not photographs): ${EXCLUDED.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
