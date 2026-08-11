/**
 * Set a page's hero banner from a local picture.
 *
 *   npx tsx --env-file=.env scripts/set-page-hero.ts \
 *     --key department-layout \
 *     --label "Layout Plan" \
 *     --path /about/department-layout \
 *     --title "Layout Plan" \
 *     --overline About \
 *     --image "C:\path\to\photo.png" \
 *     [--subtitle "…"] [--vertical 40]
 *
 * Pages read their banner from the PageHero row for their key and fall back
 * to a bundled campus shot when there is none. The admin panel can edit a row
 * once it exists; this creates it, which is the part the panel cannot do for
 * a page that has never had a banner.
 *
 * --vertical is the object-position the hero crops around: 0 keeps the top of
 * the picture, 100 the bottom, 50 the middle.
 *
 * Note the direction, which is easy to get backwards: a HIGHER number shows a
 * LOWER slice of the picture, so the picture appears to move UP in the frame.
 * To move the picture down, lower the number. A group photograph usually
 * wants something under 50, so the crop holds faces rather than tables.
 *
 * Re-runnable: the row is keyed by page, and the upload overwrites by public
 * id, so running it again replaces the banner instead of adding one.
 *
 * From Git Bash on Windows, prefix the command with `MSYS_NO_PATHCONV=1
 * MSYS2_ARG_CONV_EXCL='*'`. Without it the shell reads `--path
 * /about/department-layout` as a Unix path and rewrites it to something like
 * `C:/Program Files/Git/about/department-layout`, which is then stored as the
 * page's route and quietly breaks the admin panel's "View page" link.
 * PowerShell needs no such prefix.
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

const key = flag('key');
const label = flag('label');
const publicPath = flag('path');
const title = flag('title');
const image = flag('image');
const overline = flag('overline');
const subtitle = flag('subtitle');
const vertical = Number(flag('vertical') ?? 50);

if (!key) {
  console.error('usage: --key <pageKey> [--label …] [--path /route] [--title …] [--image <file>] [--overline …] [--subtitle …] [--vertical 0-100]');
  process.exit(1);
}
if (image && !existsSync(image)) {
  console.error(`No such file: ${image}`);
  process.exit(1);
}
if (!Number.isInteger(vertical) || vertical < 0 || vertical > 100) {
  console.error(`--vertical must be a whole number from 0 to 100, got "${flag('vertical')}"`);
  process.exit(1);
}

/**
 * Cloudinary's free plan refuses uploads over 10 MB and a camera original can
 * exceed it. A banner is never shown above 2400px, so anything larger is
 * re-encoded first and nothing visible is lost.
 */
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
  const before = await prisma.pageHero.findUnique({ where: { pageKey: key as string } });

  if (!before && (!label || !publicPath || !title || !image)) {
    console.error(
      `No banner exists for "${key}" yet — creating one needs --label, --path, --title and --image.`,
    );
    process.exit(1);
  }

  /* Re-uploading a picture that has not changed costs a slow upload and a
     Cloudinary transformation for nothing, and adjusting the crop is the
     usual reason to run this a second time. */
  let picture: { url: string; publicId: string; size: string } | null = null;
  if (image) {
    const { buffer, mime } = await readForUpload(image);
    const uploaded = await cloudinary.uploader.upload(
      `data:${mime};base64,${buffer.toString('base64')}`,
      {
        folder: `${process.env.CLOUDINARY_UPLOAD_FOLDER}/page-heroes`,
        public_id: key,
        overwrite: true,
        timeout: 120_000,
      },
    );
    picture = {
      url: uploaded.secure_url as string,
      publicId: uploaded.public_id as string,
      size: `${uploaded.width}x${uploaded.height}`,
    };
  }

  const data = {
    ...(label ? { pageLabel: label } : {}),
    ...(publicPath ? { publicPath } : {}),
    ...(title ? { heroTitle: title } : {}),
    ...(subtitle !== undefined ? { heroSubtitle: subtitle } : {}),
    ...(overline !== undefined ? { heroOverline: overline } : {}),
    ...(picture ? { heroImageUrl: picture.url, heroImagePublicId: picture.publicId } : {}),
    heroImageVerticalPercent: vertical,
  };

  /* Not an upsert: Prisma type-checks the create branch even when the row
     exists, and on an update-only run the required columns are absent by
     design — the point is to change one field and leave the rest alone. */
  const row = before
    ? await prisma.pageHero.update({ where: { pageKey: key as string }, data })
    : await prisma.pageHero.create({
        data: {
          pageKey: key as string,
          pageLabel: label as string,
          publicPath: publicPath as string,
          heroTitle: title as string,
          heroSubtitle: subtitle ?? null,
          heroOverline: overline ?? null,
          heroImageUrl: (picture as { url: string }).url,
          heroImagePublicId: (picture as { publicId: string }).publicId,
          heroImageVerticalPercent: vertical,
        },
      });

  console.log(`${before ? 'Updated' : 'Created'} the banner for ${row.publicPath}`);
  console.log(
    picture
      ? `  uploaded ${picture.size}, cropped around ${vertical}%`
      : `  kept the existing picture, cropped around ${vertical}%${
          before && before.heroImageVerticalPercent !== vertical
            ? ` (was ${before.heroImageVerticalPercent}%)`
            : ''
        }`,
  );
  console.log(`  ${row.heroImageUrl}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
