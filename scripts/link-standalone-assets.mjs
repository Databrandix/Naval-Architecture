/**
 * Post-build step for the self-hosted (VPS) target.
 *
 * `output: 'standalone'` emits `.next/standalone/server.js`, and that server
 * calls `process.chdir(__dirname)` before starting. Everything it serves off
 * disk is therefore resolved from `.next/standalone/`, not the project root:
 *
 *   - `.next/static` is NOT copied into the standalone tree by Next.js, so
 *     every hashed JS/CSS chunk 404s without this step.
 *   - `public/` is only partially traced, so fonts, PDFs and the images under
 *     public/assets 404 as well.
 *
 * Symlinking rather than copying keeps a large public/ out of the release and
 * means a rebuild does not have to re-copy it.
 *
 * Uploads are not a concern: this site stores CMS media on Cloudinary
 * (CLOUDINARY_* env), so nothing is written into public/ at runtime.
 *
 * No-ops on hosts that do not produce a standalone build (Vercel ignores
 * `output: 'standalone'`), so it is safe to run unconditionally as `postbuild`.
 */
import { existsSync, lstatSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const standalone = path.join(root, '.next', 'standalone');

if (!existsSync(standalone)) {
  process.exit(0);
}

/** `existsSync` follows links, so a broken one needs `lstat` to be seen. */
function isSymlink(p) {
  try {
    return lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
}

/** Replace `linkPath` with a symlink to `target`, whatever is there now. */
function relink(linkPath, target) {
  if (existsSync(linkPath) || isSymlink(linkPath)) {
    rmSync(linkPath, { recursive: true, force: true });
  }
  mkdirSync(path.dirname(linkPath), { recursive: true });
  // 'junction' is ignored on POSIX and avoids needing developer mode on
  // Windows, where a plain directory symlink requires elevation.
  symlinkSync(target, linkPath, process.platform === 'win32' ? 'junction' : 'dir');
  console.log(`  ${path.relative(root, linkPath)} -> ${target}`);
}

console.log('Linking standalone assets:');
relink(path.join(standalone, '.next', 'static'), path.join(root, '.next', 'static'));
relink(path.join(standalone, 'public'), path.join(root, 'public'));

/**
 * Next.js copies `.env` from the project root into the standalone tree
 * verbatim, and the standalone server loads it from there at startup.
 *
 * On the VPS that silently defeats the secret-handling design: runtime secrets
 * live only in a root-owned, mode-600 `.env.production` that systemd reads as
 * root before dropping to the service user (see deploy/name-platform.service).
 * A copy inside the release is owned by the build account and readable by the
 * service user instead.
 *
 * The build itself still needs DATABASE_URL to prerender, so a `.env` at build
 * time is legitimate; it just must not survive into the release. Dropping it
 * here rather than in a deploy script means it cannot be forgotten.
 *
 * Local `npm run dev` / `npm start` are unaffected — they read the project
 * root's `.env`, not this copy.
 */
const leakedEnv = path.join(standalone, '.env');
if (existsSync(leakedEnv)) {
  rmSync(leakedEnv, { force: true });
  console.log('  removed .next/standalone/.env (secrets come from systemd EnvironmentFile)');
}
