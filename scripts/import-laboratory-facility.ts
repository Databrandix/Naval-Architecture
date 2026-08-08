/**
 * The Laboratory Facility page.
 *
 *   npx tsx --env-file=.env scripts/import-laboratory-facility.ts
 *
 * This page is not a second list of the same rooms. /about/lab-facility is the
 * rooms — where they are, how many they seat, what they look like.
 * /about/laboratory-facility is what the department can actually do in them,
 * grouped by capability, which is what somebody deciding whether to study here
 * is asking.
 *
 * The groups below are the eight laboratories rearranged: every piece of
 * equipment named here comes from the department's Laboratory Information
 * spreadsheet, and the courses each group supports are the ones that
 * spreadsheet lists against those rooms.
 *
 * Safe to run again: it replaces the groups and rewrites the landing copy.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INTRO =
  'Ship design is taught at a desk and learned at a machine. The department’s laboratories run the length of the discipline — cutting and welding steel, loading it until it fails, measuring how water moves around a hull, and taking an engine apart to see why it turns. Every course with a sessional attached is taught in one of these rooms, and the equipment listed below is what a student actually puts their hands on.';

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
/* Three, not four: the page lays features out in three columns, and a fourth
   would sit alone on a row of its own. */

/**
 * keyLabel differs by group on purpose: a machine shop is described by its
 * tools, a fluids laboratory by its apparatus, and a materials laboratory by
 * the tests it can run. Calling all three "Key Equipment" would flatten the
 * difference.
 */
const GROUPS = [
  {
    iconName: 'Wrench',
    title: 'Machining and Fabrication',
    description:
      'The machine shop and welding bay, where a drawing first becomes metal. Students turn, mill, grind and cut stock, then join it by arc, spot, gas and argon welding — the same processes a shipyard uses on a hull.',
    keyLabel: 'Key Equipment',
    keyItems:
      'Lathe, shaper and milling machines; pedestal drill and grinders; mechanical power saw; electric arc, spot, gas and argon welding sets; full hand-tool and measurement kit including vernier calipers and micrometers.',
    focus: 'Workshop Practice, manufacturing, fabrication and production courses.',
  },
  {
    iconName: 'Gauge',
    title: 'Structures and Materials',
    description:
      'Where materials are loaded until they give way. Tension, compression, hardness, impact and beam tests establish the properties a ship structure is designed against, and the induction furnace supports work on the metals themselves.',
    keyLabel: 'Key Tests',
    keyItems:
      'Universal Testing Machine; slenderness column and helical spring testing machines; impact and Rockwell hardness testers; beam and I-section testing machine; electric induction furnace, incubator and oven.',
    focus: 'Solid Mechanics, Mechanics of Structures, Engineering Materials and Ship Structures.',
  },
  {
    iconName: 'Waves',
    title: 'Fluid Mechanics and Hydraulics',
    description:
      'The behaviour of water, measured rather than assumed. Flow over weirs and through channels, pressure on submerged surfaces, friction in pipes and the Bernoulli relation are all demonstrated on the bench before they appear in a resistance calculation.',
    keyLabel: 'Key Apparatus',
    keyItems:
      'Hydraulic bench; open channel hydraulic flume; V-notch channel and sharp-crested weir; centre of pressure apparatus; Bernoulli theorem apparatus; fluid friction, orifice and mouthpiece apparatus.',
    focus: 'Fluid Mechanics, Hydraulics and Marine Hydrodynamics.',
  },
  {
    iconName: 'Cog',
    title: 'Fluid Machinery',
    description:
      'Turbines and pumps under test — the machines that move water and the machines water moves, which between them cover most of what runs below deck.',
    keyLabel: 'Key Equipment',
    keyItems: 'Pelton wheel; gear pump.',
    focus: 'Fluid Machinery and Hydraulic Machines.',
  },
  {
    iconName: 'Flame',
    title: 'Marine Engines and Heat Transfer',
    description:
      'Diesel and spark-ignition engines opened up and put on a dynamometer, alongside apparatus for conduction, forced convection and flow over surfaces. This is the ground under Marine Engineering I, II and III.',
    keyLabel: 'Key Equipment',
    keyItems:
      'Six-cylinder and single-cylinder diesel engines; four-cylinder SI engine; engine testing dynamometer; four-stroke cylinder block and flywheel; heat conduction, water-to-water conduction and forced convection apparatus; wind tunnel.',
    focus: 'Heat Engines, Internal Combustion Engines, Thermodynamics and Heat Transfer.',
  },
];

async function main() {
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
  console.log('landing :', landing.heroTitle, '·', FEATURES.length, 'features');

  /* Replaced wholesale rather than upserted: the groups have no stable key of
     their own, and a half-updated set would read as a department that owns
     five laboratories and describes three. */
  await prisma.laboratoryLab.deleteMany();
  await prisma.laboratoryLab.createMany({
    data: GROUPS.map((group, index) => ({ ...group, displayOrder: index + 1 })),
  });

  for (const group of GROUPS) console.log('  ·', group.title);
  console.log(`\n${GROUPS.length} capability groups`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
