/**
 * Seed — brings an empty database up to the minimum the site needs to render.
 *
 * Two rows are not optional: `getDepartmentIdentity` and
 * `getUniversityIdentity` throw when their singleton is missing, so without
 * them every public page is a 500 rather than an empty one. Every other table
 * returns an array and renders as an empty section, so the rest of the content
 * belongs in the admin panel, not here.
 *
 * Safe to run more than once. The identities are upserts that only fill a
 * missing row — an existing one is left exactly as the admin last saved it,
 * because re-running a seed must never quietly undo somebody's edits. The
 * super admin is skipped when the email already exists.
 *
 *   npm run db:seed
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/* Matches src/lib/admin-actions/users.ts, so a seeded password and one set
   through the admin panel are hashed the same way. */
const BCRYPT_ROUNDS = 12;

/**
 * The university is the same for every department site. These values are the
 * ones already in use on the other department sites; the admin panel owns them
 * from here on (/admin/university-identity).
 */
const UNIVERSITY = {
  name: 'Sonargaon University',
  address: '147/I, Green Road, Panthapath, Tejgaon, Dhaka',
  phones: ['+8801775000888', '+880241010352'],
  emails: ['info@su.edu.bd'],
  facebookUrl: 'https://www.facebook.com/SonargaonUniversity',
  instagramUrl: 'https://www.instagram.com/sonargaonuniversitybd/',
  youtubeUrl: 'https://www.youtube.com/@SonargaonUniversityEdu',
  linkedinUrl: 'https://www.linkedin.com/school/14451954/',
  xUrl: 'https://x.com/SonargaonUni',
  tiktokUrl: 'https://www.tiktok.com/@sonargaonuniversityedu',
  whatsappUrl: 'https://wa.me/8801959204957',
  threadsUrl: 'https://www.threads.com/@sonargaonuniversitybd',
  erpUrl: 'http://sue.su.edu.bd:5081/sonargaon_erp/',
  applyUrl: 'http://sue.su.edu.bd:5081/sonargaon_erp/siteadmin/admission_info',
  libraryUrl: 'http://lib.su.edu.bd',
  iqacUrl: 'https://su.edu.bd/iqac',
  careerUrl: 'https://su.edu.bd/welcome/career',
  noticeUrl: 'https://su.edu.bd/welcome/notice',
  copyrightText: 'Copyright © 2026 All Rights Reserved by Sonargaon University',
  mapEmbedUrl:
    'https://maps.google.com/maps?q=Sonargaon%20University%20Panthapath%20Dhaka&hl=en&z=15&output=embed',
  logoUrl: '/assets/footer-logo.webp',
  contactSubmissionEmail: 'info@su.edu.bd',
};

/**
 * The department. This is the one block that differs between department sites,
 * and the only place to edit when this codebase is used for the next one.
 *
 * `name` renders as the department's own name — it appears beside a teacher's
 * name on every faculty page ("Dr. Karim — Department of …"), so it reads as a
 * department, not as a degree.
 *
 * The hero images point at files already in public/assets. Replacing them
 * through the admin panel swaps in Cloudinary URLs and leaves these behind.
 */
const DEPARTMENT = {
  name: 'Department of Naval Architecture & Marine Engineering',
  shortCode: 'NAME',
  facultyName: 'Faculty of Science & Engineering',
  breadcrumbLabel: 'Naval Architecture',
  primaryColor: '#2b3175',
  accentColor: '#cc1579',
  buttonColor: '#f8bd23',
  logoUrl: '/assets/su-colour-logo.webp',
  heroImage1Url: '/assets/hero-1.webp',
  heroImage1Alt: 'Sonargaon University Naval Architecture Department',
  heroImage2Url: '/assets/hero-2.webp',
  heroImage2Alt: 'Sonargaon University Naval Architecture students and faculty',
  heroImage3Url: '/assets/hero-1.webp',
  heroImage3Alt: 'Sonargaon University campus',
};

async function seedIdentities() {
  const dept = await prisma.departmentIdentity.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton', ...DEPARTMENT },
  });
  console.log(`  department identity : ${dept.name}`);

  const uni = await prisma.universityIdentity.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton', ...UNIVERSITY },
  });
  console.log(`  university identity : ${uni.name}`);
}

async function seedSuperAdmin() {
  const email = process.env.INITIAL_SUPER_ADMIN_EMAIL?.toLowerCase();
  const password = process.env.INITIAL_SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    console.log('  super admin         : skipped (INITIAL_SUPER_ADMIN_* not set)');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`  super admin         : ${email} already exists, left alone`);
    return;
  }

  const user = await prisma.user.create({
    data: { email, name: 'Super Admin', role: 'super_admin', isActive: true },
  });

  /* providerId/accountId exactly as the admin panel writes them, or Better
     Auth will not find the credential when this account signs in. */
  await prisma.account.create({
    data: {
      userId: user.id,
      providerId: 'credential',
      accountId: user.id,
      password: await bcrypt.hash(password, BCRYPT_ROUNDS),
    },
  });

  console.log(`  super admin         : ${email} created`);
}

async function main() {
  console.log('Seeding:');
  await seedIdentities();
  await seedSuperAdmin();
  console.log('Done. Change the seeded password after the first sign-in.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
