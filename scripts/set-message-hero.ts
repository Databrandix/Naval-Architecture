/**
 * Set the banner on a leadership message page.
 *
 *   npx tsx --env-file=.env scripts/set-message-hero.ts \
 *     --role head --image "C:\path\to\photo.jpg" [--vertical 40]
 *
 * /about/message-from-head and /about/deans-message do not read PageHero
 * like the rest of the site — their banner hangs off the Faculty row of the
 * person whose message it is, beside the message itself. So this is a
 * separate script from set-page-hero.ts, not a flag on it: a different table
 * and a different notion of what the page belongs to.
 *
 * --vertical is the object-position the banner crops around. Note the
 * direction, which is easy to get backwards: a HIGHER number shows a LOWER
 * slice of the picture, so the picture appears to move UP in the frame. To
 * move the picture down, lower the number.
 *
 * Omit --image to re-crop the banner already there without re-uploading it.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function flag(name: string): string | undefined {
  const at = process.argv.indexOf(`--${name}`);
  return at === -1 ? undefined : process.argv[at + 1];
}

const role = flag('role');
const image = flag('image');
const verticalFlag = flag('vertical');

if (role !== 'head' && role !== 'dean') {
  console.error('usage: --role head|dean [--image <file>] [--vertical 0-100]');
  process.exit(1);
}
if (image && !existsSync(image)) {
  console.error(`No such file: ${image}`);
  process.exit(1);
}
if (verticalFlag !== undefined) {
  const n = Number(verticalFlag);
  if (!Number.isInteger(n) || n < 0 || n > 100) {
    console.error(`--vertical must be a whole number from 0 to 100, got "${verticalFlag}"`);
    process.exit(1);
  }
}

/** Cloudinary's free plan refuses uploads over 10 MB; a banner is never shown
 *  above 2400px, so a camera original is re-encoded on the way up. */
async function readForUpload(filePath: string): Promise<{ buffer: Buffer; mime: string }> {
  const original = readFileSync(filePath);
  if (original.byteLength <= 9 * 1024 * 1024) {
    const extension = path.extname(filePath).toLowerCase().replace('.', '');
    return { buffer: original, mime: `image/${extension === 'jpg' ? 'jpeg' : extension || 'jpeg'}` };
  }
  const sharp = (await import('sharp')).default;
  const resized = await sharp(original)
    .rotate()
    .resize({ width: 2400, withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();
  console.log(
    `  resized ${(original.byteLength / 1048576).toFixed(1)} MB → ${(resized.byteLength / 1048576).toFixed(1)} MB`,
  );
  return { buffer: resized, mime: 'image/jpeg' };
}

async function main() {
  const where = role === 'head' ? { isHead: true } : { isDean: true };
  const person = await prisma.faculty.findFirst({ where });
  if (!person) {
    throw new Error(`No faculty member is flagged as ${role}.`);
  }

  const data: {
    messageHeroImageUrl?: string;
    messageHeroImagePublicId?: string;
    messageHeroImageVerticalPercent?: number;
  } = {};

  if (image) {
    const { buffer, mime } = await readForUpload(image);
    const uploaded = await cloudinary.uploader.upload(
      `data:${mime};base64,${buffer.toString('base64')}`,
      {
        folder: `${process.env.CLOUDINARY_UPLOAD_FOLDER}/page-heroes`,
        public_id: `message-from-${role}`,
        overwrite: true,
        timeout: 120_000,
      },
    );
    data.messageHeroImageUrl = uploaded.secure_url as string;
    data.messageHeroImagePublicId = uploaded.public_id as string;
    console.log(`  uploaded ${uploaded.width}x${uploaded.height}`);
  }

  if (verticalFlag !== undefined) data.messageHeroImageVerticalPercent = Number(verticalFlag);

  if (Object.keys(data).length === 0) {
    console.error('Nothing to change — pass --image, --vertical, or both.');
    process.exit(1);
  }

  const updated = await prisma.faculty.update({ where: { id: person.id }, data });

  console.log(`Banner set for the ${role}'s message page — ${person.name}`);
  console.log(`  cropped around ${updated.messageHeroImageVerticalPercent}%`);
  console.log(`  ${updated.messageHeroImageUrl}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
