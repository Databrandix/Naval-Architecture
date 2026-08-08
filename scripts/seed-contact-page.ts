/**
 * The contact page: its wording, the quick-contact cards, and the university's
 * campus addresses.
 *
 *   npx tsx --env-file=.env scripts/seed-contact-page.ts
 *
 * The campuses belong to the university, not to any one department, so they
 * are the same on every department site. The cards are built from
 * UniversityIdentity and from this department's own office and coordinator, so
 * a visitor reaches the department rather than the university switchboard.
 *
 * Safe to run again; it fills what is missing and refreshes what it owns.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CAMPUSES = [
  {
    slug: 'permanent-campus',
    name: 'Permanent Campus',
    tag: null,
    address: 'Ward No–75, Dasher Kandi, Khilgaon, Dhaka-1219',
    displayOrder: 1,
  },
  {
    slug: 'panthapath-campus',
    name: 'Panthapath Campus',
    tag: 'City Campus-1',
    address: '147/I, Green Road, Panthapath, Dhaka-1215',
    displayOrder: 2,
  },
  {
    slug: 'mohakhali-campus',
    name: 'Mohakhali Campus',
    tag: 'City Campus-2',
    address: 'GP Ja-146, Wireless Gate, Mohakhali, Dhaka-1212',
    displayOrder: 3,
  },
];

async function main() {
  const [university, dept, coordinator, offices] = await Promise.all([
    prisma.universityIdentity.findUnique({ where: { id: 'singleton' } }),
    prisma.departmentIdentity.findUnique({ where: { id: 'singleton' } }),
    /* The coordinator is the person the service charter sends students to for
       course matters, so they are the department's answer to "who do I ask". */
    prisma.faculty.findFirst({
      where: { designation: { contains: 'Coordinator', mode: 'insensitive' } },
      select: { name: true, email: true, phone: true },
    }),
    prisma.officeLocation.findMany({ where: { isDepartment: true }, orderBy: { displayOrder: 'asc' } }),
  ]);

  if (!university || !dept) throw new Error('run the seed first — university or department identity is missing');

  /**
   * The university's own address leads, with the coordinator underneath.
   *
   * Two reasons, both from the department's files. The faculty sheet and the
   * service charter give this person different addresses and different phone
   * numbers, so neither can be called authoritative. And both are personal
   * accounts: a public "contact the department" card that leads with somebody's
   * gmail leaves the department unreachable the day they change roles.
   *
   * The service charter's details are the ones used for the secondary line —
   * that is the document the department publishes to students.
   */
  const CHARTER_CONTACT = { email: 'sheikhabid201@gmail.com', phone: '01951553673' };

  const officialEmail = university.emails[0] ?? 'info@su.edu.bd';
  const officialPhone = university.phones[0] ?? '';
  const headOffice = offices.find((office) => /head/i.test(office.name)) ?? offices[0];

  const cards = [
    {
      title: 'Department Office',
      iconName: 'Building2',
      primaryValue: headOffice ? `${headOffice.name}, ${headOffice.level}` : dept.name,
      primaryHref: null,
      secondaryValue: headOffice?.building ?? university.address,
      secondaryHref: null,
      hint: 'Sunday to Thursday, 9 AM – 5 PM',
    },
    {
      title: 'Phone',
      iconName: 'Phone',
      primaryValue: officialPhone,
      primaryHref: officialPhone ? `tel:${officialPhone.replace(/[^\d+]/g, '')}` : null,
      secondaryValue: CHARTER_CONTACT.phone,
      secondaryHref: `tel:${CHARTER_CONTACT.phone}`,
      hint: coordinator ? `Course matters: ${coordinator.name}, Coordinator` : null,
    },
    {
      title: 'E-mail',
      iconName: 'Mail',
      primaryValue: officialEmail,
      primaryHref: `mailto:${officialEmail}`,
      secondaryValue: CHARTER_CONTACT.email,
      secondaryHref: `mailto:${CHARTER_CONTACT.email}`,
      hint: 'Course matters go to the coordinator',
    },
    {
      title: 'Admission',
      iconName: 'GraduationCap',
      primaryValue: 'Apply online',
      primaryHref: university.applyUrl,
      secondaryValue: 'Admission requirements',
      secondaryHref: '/admission/requirements',
      hint: null,
    },
  ];

  const content = {
    heroTitle: 'Contact Us',
    heroOverline: 'Get in Touch',
    heroImageUrl: dept.heroImage1Url,
    heroImagePublicId: dept.heroImage1PublicId,
    heroImageVerticalPercent: 45,
    introBody: `Questions about admission to the B.Sc. programme, courses and registration, shipyard training, or research with the ${dept.name} — this is where to send them. For anything the department office cannot settle, the relevant university office is listed on the department layout page.`,
    quickContactHeading: 'Quick Contact Information',
    formHeading: 'Send Us a Message',
    formSubheading:
      'Tell us what you need and who you are, and the department office will come back to you. Prospective students should say which intake they are asking about.',
    campusesHeading: 'Campus Locations',
    responseTimeNote: 'We typically respond within 1–2 working days.',
    quickContactCards: cards,
  };

  await prisma.contactPageContent.upsert({
    where: { id: 'singleton' },
    update: content,
    create: { id: 'singleton', ...content },
  });

  for (const campus of CAMPUSES) {
    const data = {
      ...campus,
      /* One switchboard and one address for the university; the department's
         own line is on the cards above. */
      phone: university.phones[0] ?? null,
      email: university.emails[0] ?? 'info@su.edu.bd',
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Sonargaon University ${campus.address}`)}`,
    };
    await prisma.campusLocation.upsert({ where: { slug: campus.slug }, update: data, create: data });
  }

  console.log('contact page');
  for (const card of cards) console.log(`  ${card.title.padEnd(20)} ${card.primaryValue}`);
  console.log(`\n${CAMPUSES.length} campuses`);
  for (const campus of CAMPUSES) console.log(`  ${campus.name.padEnd(20)} ${campus.address}`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
