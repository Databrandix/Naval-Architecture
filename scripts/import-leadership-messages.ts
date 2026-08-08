/**
 * The Dean, and the two leadership messages.
 *
 *   npx tsx --env-file=.env scripts/import-leadership-messages.ts
 *
 * /about/deans-message and /about/message-from-head are not their own tables:
 * each renders the faculty member flagged isDean or isHead. The Dean is not in
 * the faculty spreadsheet — he belongs to the faculty of engineering, not to
 * this department — so his record is created here, from the department's
 * content submission form, and the head's message is attached to the row the
 * faculty import already created.
 *
 * Run after import-faculty.ts. Safe to run again: it upserts.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEAN_SLUG = 'habibur-rahman-kamal';
const HEAD_SLUG = 'khabirul-haque-chowdhury';

const DEAN_MESSAGE = [
  'It is my pleasure to welcome you to the Department of Naval Architecture and Marine Engineering (NAME) under the Faculty of Science and Engineering and Technology at Sonargaon University. I believe engineering education should foster innovation, professional excellence, and integrity. The NAME department is dedicated to developing graduates with strong technical skills, leadership ability, and ethical values to serve the maritime and shipbuilding sectors nationally and internationally.',
  'We provide a dynamic learning environment where academic rigor is supported by practical training, research, and industry engagement. With committed faculty members, an outcome-based curriculum, and a culture of continuous improvement, we prepare students to become responsible engineers to address challenges in marine transportation, offshore engineering, sustainable ship design, and the blue economy.',
  'As Bangladesh advances as a maritime nation, the need for skilled naval engineers and naval architects continues to grow. I encourage students, faculty, alumni, industry partners, and well-wishers to join us in this mission of excellence and to help shape future leaders dedicated to innovation, professionalism, and national development.',
];

const HEAD_MESSAGE = [
  'Sonargaon University (SU) is the only private university in Bangladesh that offers B.Sc. in Naval Architecture and Marine Engineering (NAME). Our NAME department started its journey in January 2014. Since then, all work has been audited regularly by the University Grants Commission (UGC) of Bangladesh, and we have been supported by a strong Academic Advisory Council. Faculty members are carefully selected on the basis of academic records, teaching skills and research experience.',
  'Specialist faculty members from other universities, especially from the NAME department of BUET, are also engaged for different courses. A student of our department will be able to design and analyse systems for ships, marine structures and other technologies that operate in oceans. He will reap the benefits of small classes, informative lectures and course materials in rich and modern laboratories, practical shipyard training and approachable faculty members.',
  'It is a very exciting, challenging and rewarding career in the field of naval architecture and marine engineering that includes the shipbuilding industry (commercial, private and defence-related), passenger transportation, Navy and Coast Guard activities (offshore oil, gas and mineral protection), recreational boating and the sailboat industry. Our NAME department is tirelessly producing graduates in this field for many reputed Government and Private organizations all over the country and abroad with a good reputation.',
];

async function main() {
  /* displayOrder 0 puts the Dean above the head on the faculty page; both are
     leadership, and the department lists the Dean first. */
  const dean = await prisma.faculty.upsert({
    where: { slug: DEAN_SLUG },
    update: {
      designation: 'Dean, Faculty of Science and Engineering',
      messageParagraphs: DEAN_MESSAGE,
    },
    create: {
      slug: DEAN_SLUG,
      name: 'Brigadier General (Retd.) Habibur Rahman Kamal, ndc, psc, PhD',
      designation: 'Dean, Faculty of Science and Engineering',
      secondaryTitle: 'Sonargaon University',
      badge: 'Dean',
      type: 'leadership',
      displayOrder: 0,
      isDean: true,
      messageOverline: 'About',
      messageHeading: 'Message from the Dean',
      messageTitleLine1: 'Message from',
      messageTitleLine2: 'the Dean',
      messageParagraphs: DEAN_MESSAGE,
    },
  });
  console.log('dean :', dean.name);
  console.log('       ', dean.messageParagraphs.length, 'paragraphs · photo:', dean.photoUrl ? 'yes' : 'none');

  const head = await prisma.faculty.update({
    where: { slug: HEAD_SLUG },
    data: {
      messageOverline: 'About',
      messageHeading: 'Message from the Head',
      messageTitleLine1: 'Message from',
      messageTitleLine2: 'the Head',
      messageParagraphs: HEAD_MESSAGE,
      /* The portrait already on the record doubles as the message photo, so the
         two pages do not need separate uploads of the same face. */
      messagePhotoUrl: (await prisma.faculty.findUnique({ where: { slug: HEAD_SLUG } }))?.photoUrl ?? null,
    },
  });
  console.log('head :', head.name);
  console.log('       ', head.messageParagraphs.length, 'paragraphs · photo:', head.messagePhotoUrl ? 'yes' : 'none');
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
