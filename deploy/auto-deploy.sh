#!/usr/bin/env bash
#
# Pull-based deployment for name.su.edu.bd. Installed to
# /usr/local/bin/name-deploy; this copy is the version-controlled reference.
#
# It runs from /usr/local/bin rather than from the release directory for two
# reasons: `git pull` below would rewrite the script while bash is still reading
# it, and a root-owned copy cannot be edited by name-build to widen its own
# privileges. Updating it is therefore a deliberate root action.
#
# DATABASE_URL and DIRECT_URL arrive from name-deploy.service's EnvironmentFile
# and point at the LOCAL PostgreSQL 18 cluster on 5433, never at 5432.
set -Eeuo pipefail

RELEASE=/var/www/sites/name.su.edu.bd
CACHE=/var/www/sites/name-platform-cache
SERVER="$RELEASE/.next/standalone/.next/server"
UNIT=name-platform.service
BRANCH=main
# systemd sets RUNTIME_DIRECTORY from the unit's RuntimeDirectory=, and removes
# that directory when the unit stops. The fallback keeps a hand-run invocation
# working instead of dying on a missing lock path.
LOCKFILE="${RUNTIME_DIRECTORY:-/tmp}/name-deploy.lock"

log() { printf '%s\n' "$*"; }
die() { printf 'ABORT: %s\n' "$*" >&2; exit 1; }

# One deployment at a time. A build outlasts the five-minute timer interval, so
# without this the next tick would start a second build in the same directory.
exec 9>"$LOCKFILE" || die "cannot open lock file $LOCKFILE"
if ! flock -n 9; then
  log "another deployment is already running; skipping this run"
  exit 0
fi

cd "$RELEASE" || die "release directory missing: $RELEASE"

# Build credentials come from the unit's EnvironmentFile
# (/etc/name-platform/build.env, root-owned 0600) and must exist nowhere else.
# A .env in the release is a readable copy of the database credentials sitting
# on disk between builds, which is what the EnvironmentFile exists to avoid.
# Fail rather than warn: a warning in a journal nobody reads is not a control.
if [ -e "$RELEASE/.env" ]; then
  die "$RELEASE/.env exists; build credentials must come from systemd only. Remove it."
fi

# The working tree must be pristine. Nothing in this script ever discards local
# changes: no reset --hard, no clean, no checkout of arbitrary commits, no
# history rewriting, no force push. A dirty tree means somebody edited something
# on the server, and that is a question for a human rather than for a timer.
if [ -n "$(git status --porcelain)" ]; then
  git status --short >&2
  die "working tree is dirty; refusing to deploy"
fi

# Read-only from here until the pull: fetch writes remote-tracking refs inside
# .git and touches no tracked file.
git fetch --quiet origin "$BRANCH" || die "git fetch failed"
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$BRANCH")

if [ "$LOCAL" = "$REMOTE" ]; then
  log "already at ${LOCAL:0:7}; nothing to deploy"
  exit 0
fi

# Checked before the pull so the failure names the real problem -- a force-push
# or a diverged server -- instead of leaving git to refuse a merge.
git merge-base --is-ancestor "$LOCAL" "$REMOTE" \
  || die "origin/$BRANCH is not a fast-forward from ${LOCAL:0:7}; refusing to deploy"

log "deploying ${LOCAL:0:7} -> ${REMOTE:0:7}"
git pull --ff-only origin "$BRANCH" || die "git pull --ff-only failed"

# node_modules at the project root is only used to build. The running service
# serves from .next/standalone, which carries its own traced copy, so
# reinstalling here does not disturb it.
#
# --ignore-scripts: a dependency's install hook would otherwise run arbitrary
# code as name-build on every lockfile change. Safe for this project -- the
# Prisma query engine, sharp's libvips and esbuild's binary all arrive as
# platform-specific optional dependencies, and `prisma generate` runs explicitly
# as part of `npm run build`.
if ! git diff --quiet "$LOCAL" "$REMOTE" -- package-lock.json; then
  log "package-lock.json changed; reinstalling dependencies"
  npm ci --no-audit --no-fund --ignore-scripts || die "npm ci failed"
fi

# `npm run build` runs `prisma generate` -- code generation from the schema
# file, which never opens a database connection -- and then `next build`. No
# migrate, no db push, no seed, here or anywhere else in this script. Schema
# changes stay a deliberate human action.
#
# This is also the point of no return for the live site: next build wipes and
# rewrites .next in place, so a failure here leaves the release degraded until
# the next successful build. See deploy/README.md.
npm run build || die "build failed; service was NOT restarted"

# next build wiped .next and took this symlink with it. Restored only now,
# because there is no point pointing the cache at a build that never finished.
ln -sfn "$CACHE" "$RELEASE/.next/standalone/.next/cache" \
  || die "could not restore ISR cache symlink"

# next build also recreated server/ as name-build:name-build, which the service
# account cannot write -- and Next.js's filesystem ISR writes regenerated pages
# into server/app, not into the cache directory above. Without this the service
# fails at runtime with EACCES on the first revalidation.
#
# Ownership stays with name-build; nothing here is chowned. Directories and
# files are handled separately because they need different bits: a directory
# needs +x to be traversed at all, while a regular file must not gain execute
# permission it never had. The setgid bit makes route directories Next.js
# creates at runtime inherit the group.
#
# Scope is the server/ subtree only. The cache symlink is a sibling rather than
# a descendant, and -type d/-type f means symlinks are never followed.
find "$SERVER" -type d -exec chgrp name-web {} + -exec chmod g+rwx,g+s {} + \
  || die "could not set directory permissions under server/"
find "$SERVER" -type f -exec chgrp name-web {} + -exec chmod g+w {} + \
  || die "could not set file permissions under server/"

# The one privileged action, and the only one this account is allowed
# (/etc/sudoers.d/name-deploy). -n so a missing sudoers rule fails immediately
# rather than blocking on a password prompt no timer can answer.
sudo -n /usr/bin/systemctl restart "$UNIT" || die "restart failed"

# Restarting is not instantaneous. Without this wait the first health check
# would be a race rather than a measurement.
for i in $(seq 1 30); do
  if curl -fsS -o /dev/null --max-time 5 http://127.0.0.1:3003/; then break; fi
  [ "$i" -eq 30 ] && die "app did not answer on 127.0.0.1:3003 within 60s"
  sleep 2
done

# All three must pass. The loopback request proves the Node process is up; the
# public URL proves DNS, TLS and Nginx still route to it; /api/health proves the
# process can reach its database, which the other two cannot show.
FAILED=0
check() {
  if curl -fsS -o /dev/null --max-time "$2" "$1"; then
    log "health OK    $1"
  else
    log "health FAIL  $1"
    FAILED=1
  fi
}
check http://127.0.0.1:3003/            10
check https://name.su.edu.bd/           15
check https://name.su.edu.bd/api/health 15

[ "$FAILED" -eq 0 ] || die "deployed ${REMOTE:0:7} but health checks failed"
log "deployed ${REMOTE:0:7} successfully"
