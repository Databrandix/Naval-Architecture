# Deploying name.su.edu.bd to the university VPS

Target host: `187.52.118.124` (`srv1905813`, Ubuntu 24.04, Node v24.19.0).

This site is the third on the box. It shares the machine with the other two and
nothing else: separate service user, build user, port, release directory, Nginx
vhost, PostgreSQL **cluster**, database and roles.

| | su.edu.bd | me.su.edu.bd | **name.su.edu.bd** |
|---|---|---|---|
| Release dir | `/var/www/sites/su.edu.bd` | `/var/www/sites/me.su.edu.bd` | `/var/www/sites/name.su.edu.bd` |
| Service user | `su-web` | `me-web` | `name-web` |
| Build user | `deploy` | `me-build` | `name-build` |
| Port | `127.0.0.1:3001` | `127.0.0.1:3002` | `127.0.0.1:3003` |
| systemd unit | `su-platform` | `me-platform` | `name-platform` |
| Nginx vhost | `su-platform` | `me-platform` | `name-platform` |
| Database | PostgreSQL 16, `:5432` | Neon (off-host) | **PostgreSQL 18, `:5433`** |
| DB name | `su_platform` | — | `name_platform` |
| DB roles | `su_app` / `su_build` | — | `name_app` / `name_build` |
| CMS media | local disk | Cloudinary | Cloudinary |

**Production secrets are never committed.** `.env.production` and
`/etc/name-platform/build.env` are created by hand on the server, root-owned and
mode 0600. Everything in this directory is a template or a reference copy.

Steps marked **(root)** need a human with sudo. The deployment account cannot
perform them, and that is the design.

---

## Environment separation

Two disjoint sets of secrets, each read by systemd as root and injected into
one process:

| File | Owner | Mode | Contents | Read by |
|---|---|---|---|---|
| `/etc/name-platform/build.env` | `root:root` | `0600` | `DATABASE_URL`, `DIRECT_URL` — the **`name_build`** role | the build, via `name-deploy.service` |
| `/etc/name-platform/.env.production` | `root:root` | `0600` | every runtime secret — the **`name_app`** role | the app, via `name-platform.service` |

Neither `name-build` nor `name-web` can read either file. systemd reads them as
root and only then drops privileges, so the values exist in a process
environment and never in a file the accounts can open.

The split matters: the build prerenders database-backed pages, so it needs
Postgres and nothing else. It has no use for `BETTER_AUTH_SECRET`,
`CLOUDINARY_API_SECRET`, `RESEND_API_KEY` or `INITIAL_SUPER_ADMIN_PASSWORD`, so
it never receives them. The build role is `name_build`, which holds `SELECT` and
no write privilege at all.

**There is no `.env` on the server.** Next.js and Prisma read `process.env`
directly. The deploy script refuses to run while a `.env` exists in the release,
because that would be a readable copy of the database credentials sitting on
disk between builds.

`DATABASE_URL` points at **`127.0.0.1:5433`** — the PostgreSQL 18 cluster. Port
5432 belongs to `su.edu.bd` and must never appear in this site's configuration.
There is no connection pooler, so `DIRECT_URL` is the same URL; Prisma still
requires the key because the schema declares `directUrl`.

---

## Install

```bash
# 1. (root) Accounts. Neither has a shell: they are reachable only through
#    systemd. name-build must belong to name-web, because handing the ISR
#    server tree to that group requires membership of it.
sudo useradd --system --no-create-home --shell /usr/sbin/nologin name-web
sudo useradd --system --no-create-home --shell /usr/sbin/nologin name-build
sudo usermod -aG name-web name-build

# 2. (root) Directories. /var/www/sites is owned by `deploy`, so name-build
#    cannot create its own release directory.
sudo install -d -o name-build -g name-build -m 0755 /var/www/sites/name.su.edu.bd
sudo install -d -o name-build -g name-web   -m 2775 /var/www/sites/name-platform-cache

# 3. Clone as the build account. The repository is public; no key is needed.
sudo -u name-build git clone https://github.com/Databrandix/Naval-Architecture.git \
  /var/www/sites/name.su.edu.bd

# 4. (root) Build credentials — name_build role, port 5433.
sudo install -d -o root -g root -m 0700 /etc/name-platform
sudo install -o root -g root -m 0600 /dev/null /etc/name-platform/build.env
sudo nano /etc/name-platform/build.env          # see deploy/build.env.example

# 5. (root) Runtime secrets — name_app role, plus auth, Cloudinary, Resend.
sudo install -o root -g root -m 0600 /dev/null \
  /etc/name-platform/.env.production
sudo nano /etc/name-platform/.env.production

# 6. (root) Sudoers. Validate BEFORE installing — a malformed file in
#    sudoers.d locks every account out of sudo.
cd /var/www/sites/name.su.edu.bd
sudo visudo -c -f deploy/sudoers.name-deploy
sudo install -o root -g root -m 0440 deploy/sudoers.name-deploy /etc/sudoers.d/name-deploy

# 7. (root) Script and units.
sudo install -o root -g root -m 0755 deploy/auto-deploy.sh /usr/local/bin/name-deploy
sudo cp deploy/name-platform.service deploy/name-deploy.service \
        deploy/name-deploy.timer /etc/systemd/system/
sudo systemctl daemon-reload

# 8. First build — see "First deployment (bootstrap)" below. `systemctl start
#    name-deploy` does NOT work here: the deploy script compares HEAD against
#    origin/main, and a fresh clone is already at origin/main, so it exits with
#    "nothing to deploy" without building anything.

# 9. (root) Nginx. The template proxies over plain HTTP and contains no
#    redirect; certbot copies the block to build the TLS one.
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/name-platform
sudo ln -s /etc/nginx/sites-available/name-platform /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 10. DNS: name.su.edu.bd  A  187.52.118.124 — then wait for it to resolve.
#     Certbot's HTTP-01 challenge fails until it does.
sudo certbot --nginx -d name.su.edu.bd --redirect

# 11. Only once everything above is verified.
sudo systemctl enable --now name-deploy.timer
```

---

## Deployment modes

Three distinct paths. Confusing them is how the first install fails.

| | When | Command | Builds? |
|---|---|---|---|
| **Bootstrap** | first ever deploy, or after a rollback | `systemd-run` block below | always |
| **On demand** | a commit is on `origin/main` and you do not want to wait | `sudo systemctl start name-deploy` | only if `origin/main` moved |
| **Timer** | normal operation | automatic, every 5 minutes | only if `origin/main` moved |

The last two run the same script, and that script is a **no-op when the release
is already at `origin/main`**. That is correct for routine deployments and wrong
for the first one, which is why bootstrap exists.

### First deployment (bootstrap)

The build needs `DATABASE_URL` from `/etc/name-platform/build.env`, and a plain
shell does not receive it. `systemd-run` reproduces exactly what
`name-deploy.service` would do — reads the file as root, drops to `name-build`,
applies the same sandbox — without depending on the "has origin/main moved?"
check. **No secret is printed or copied.**

```bash
cd /var/www/sites/name.su.edu.bd

# npm's cache and Next.js's telemetry need somewhere to write; name-build has
# no home directory. These are the same paths systemd would create through
# StateDirectory= and CacheDirectory=.
sudo install -d -o name-build -g name-build -m 0755 /var/lib/name-build /var/cache/name-build

# Dependencies. No credentials involved, so no systemd-run needed.
sudo -u name-build env HOME=/var/lib/name-build npm_config_cache=/var/cache/name-build \
  npm ci --no-audit --no-fund --ignore-scripts

# The build itself, with build.env injected by systemd as root.
sudo systemd-run --unit=name-bootstrap-build --wait --collect \
  --uid=name-build --gid=name-build \
  --property=EnvironmentFile=/etc/name-platform/build.env \
  --property=WorkingDirectory=/var/www/sites/name.su.edu.bd \
  --property=ProtectSystem=strict \
  --property=ReadWritePaths=/var/www/sites/name.su.edu.bd \
  --property=ReadWritePaths=/var/www/sites/name-platform-cache \
  --property=TimeoutStartSec=1800 \
  --setenv=NODE_ENV=production \
  --setenv=NEXT_TELEMETRY_DISABLED=1 \
  --setenv=HOME=/var/lib/name-build \
  --setenv=npm_config_cache=/var/cache/name-build \
  /usr/bin/npm run build

# The two steps the deploy script performs after every build. They are not
# optional: without them ISR fails at runtime rather than at deploy time.
sudo -u name-build ln -sfn /var/www/sites/name-platform-cache \
  .next/standalone/.next/cache
sudo -u name-build find .next/standalone/.next/server -type d \
  -exec chgrp name-web {} + -exec chmod g+rwx,g+s {} +
sudo -u name-build find .next/standalone/.next/server -type f \
  -exec chgrp name-web {} + -exec chmod g+w {} +

# Only now can the service start: its WorkingDirectory and both ReadWritePaths
# live inside .next/standalone, which did not exist until the build finished.
sudo systemctl enable --now name-platform
curl -I http://127.0.0.1:3003
curl -s http://127.0.0.1:3003/api/health
```

Check `.next/BUILD_ID` exists before starting the service. Next.js writes that
file last, so its absence means the build did not finish.

`nginx -t` must pass before the reload. If it fails, `su.edu.bd` and
`me.su.edu.bd` keep running on the old config — a reload only applies a valid
one.

---

## Required human root actions

Everything in the list above marked **(root)**, plus anything that touches
`/etc`, systemd, Nginx, DNS or PostgreSQL. The deployment system holds exactly
one privilege:

```
name-build ALL=(root) NOPASSWD: /usr/bin/systemctl restart name-platform.service
```

One command, no wildcard. `systemctl restart *` would have covered
`su-platform.service` too. The filesystem boundary is enforced separately by
`ProtectSystem=strict` in both units: the kernel refuses writes outside this
site's release and cache, whatever the build does.

Verify both, as `name-build`:

```bash
sudo -u name-build -H sudo -n systemctl restart su-platform.service   # must be denied
sudo -u name-build test -w /var/www/sites/su.edu.bd && echo writable  # must print nothing
```

---

## Deployment flow

A timer polls `origin/main` every five minutes and deploys when it moves.
Nothing is granted to GitHub — no deploy key, no webhook, no inbound port.

```
flock → refuse if .env present → refuse if working tree dirty → git fetch
      → stop if origin/main has not moved → refuse non-fast-forward
      → git pull --ff-only → npm ci (only if the lockfile changed)
      → npm run build → restore ISR cache symlink → repair ISR permissions
      → restart → three health checks
```

Any failure before the restart aborts without touching the service. The script
never runs a migration, `db push` or seed; `npm run build` invokes
`prisma generate`, which reads the schema file and generates TypeScript without
connecting to the database. **Schema changes stay a deliberate human action.**

```bash
journalctl -u name-deploy -f              # live
systemctl list-timers name-deploy.timer   # when it next fires
sudo systemctl start name-deploy          # deploy now, without waiting
systemctl is-failed name-deploy           # did the last run fail?
```

A run with nothing to do logs `already at <sha>; nothing to deploy` and exits 0.
A run that collides with another logs `skipping this run`. Neither is a failure.

---

## Why `server/` needs group write

Next.js does not keep ISR output in `.next/cache`. When a page with
`revalidate` regenerates, the filesystem incremental cache writes the new render
back into the server bundle as
`.next/standalone/.next/server/app/<route>.html` (plus `.rsc` and `.meta`).

The build runs as `name-build` and creates that tree `name-build:name-build`.
`name-web` belongs to no group but its own, so it matches "other" — read and
traverse, no write — and the service fails on the first revalidation with:

```
EACCES: permission denied, open '.../standalone/.next/server/app/index.html'
```

The deploy script therefore hands `server/` to the `name-web` group after every
successful build, opening directory and file bits separately: a directory needs
`+x` to be traversed and `+w` to have entries created in it, while a regular
file needs `+w` and must not gain an execute bit it never had. A single
`chmod -R g+w` would leave directories untraversable. The setgid bit makes route
directories created at runtime inherit the group.

**Ownership stays with `name-build`** — it is the account that builds, rewrites
and replaces this tree on every deployment. Only `server/` is opened, and only
to the group; the rest of the release stays read-only to the service.

**This repeats on every build,** because `next build` deletes `.next` and
recreates it from scratch. A one-off manual `chmod` fixes the site only until
the next deployment.

Both write paths are also named explicitly in `name-platform.service` under
`ReadWritePaths=`, as **real paths**: `ReadWritePaths` resolves against the real
filesystem, so listing the `.next/cache` symlink would not make its target
writable.

---

## Known limitation

`npm run build` rewrites `.next` **in place**, inside the directory the running
service is serving from. For the 1–3 minutes a build takes, the hashed files
under `.next/static` are being replaced, so a visitor who loaded a page just
before the build can get 404s on its assets. If the build fails, `.next` is left
partially rewritten and the site stays degraded until the next successful build
— the service keeps running, but it is not intact.

There is no artifact rollback. Going back to an earlier commit means building
that commit, with the same duration and the same risk.

The fix, when this starts to hurt, is to build into `releases/<sha>` and swap a
symlink after the health checks pass, which makes rollback a symlink swap and a
restart.

---

## Rollback

**`git checkout <old-sha>` on the server does not roll anything back.** The
deploy script fast-forwards to `origin/main` on its next run, so the checkout is
undone within five minutes — and the timer does it silently. Both procedures
below exist because of that.

### Normal rollback — revert on the branch

The only rollback the automation cannot fight, because it changes what
`origin/main` points at:

```bash
# On a workstation, not the server.
git revert <bad-sha>          # creates a new commit undoing it; no history rewrite
git push origin main
```

The timer picks the revert up within five minutes and rebuilds. Nothing on the
server needs touching, and there is no window in which the release and the
branch disagree.

Prefer this. A revert is auditable, works the same for anyone on the team, and
leaves the deployment path exactly as it is on every other day.

### Emergency rollback — when waiting for a revert is not acceptable

Only when the site is broken now and a revert cannot be prepared quickly.

**Stop the timer first.** Skipping this is the whole failure mode: the next tick
pulls `origin/main` and reinstates the broken build.

```bash
sudo systemctl stop name-deploy.timer          # FIRST. Not optional.
systemctl is-active name-deploy.timer          # must print "inactive"

cd /var/www/sites/name.su.edu.bd
git log --oneline -10
sudo -u name-build git checkout <previous-sha>
```

Then rebuild at that commit using the **bootstrap procedure above** — the deploy
script cannot be used here, because it would pull `origin/main` again.

The release is now on a detached HEAD and deliberately out of step with
`origin/main`. **Leave the timer stopped** until `origin/main` has been fixed by
a revert, then:

```bash
cd /var/www/sites/name.su.edu.bd
sudo -u name-build git checkout main
sudo systemctl start name-deploy.timer
```

A detached HEAD with the timer stopped is a visible, temporary state. A detached
HEAD with the timer running is a rollback that quietly undoes itself.

Nothing here uses `reset --hard`, `clean -fd` or a force push: `git checkout` of
an existing commit is reversible, and the working tree stays intact so the
deploy script's dirty-tree guard keeps working.

To take the site down without removing it:

```bash
sudo systemctl stop name-platform
sudo systemctl disable --now name-deploy.timer
sudo rm /etc/nginx/sites-enabled/name-platform
sudo nginx -t && sudo systemctl reload nginx
```

**Database rollback is separate and manual.** There is no automated backup of
`name_platform` yet, and nothing in the deploy path touches the schema. Take a
dump before any migration:

```bash
sudo -u postgres /usr/lib/postgresql/18/bin/pg_dump --port=5433 \
  --format=custom --no-owner --no-privileges \
  --file=/var/backups/postgres/name_platform-$(date +%Y%m%d-%H%M).dump name_platform
```

---

## Operating notes

Four things that have already cost hours on the neighbouring deployment.

**Never run `npm run build` by hand on the server.** A plain shell does not
receive `/etc/name-platform/build.env`, so `DATABASE_URL` is empty; the build
gets far enough to delete `.next` and then dies collecting page data, leaving a
release with no `BUILD_ID` and a site that cannot start. Use
`sudo systemctl start name-deploy`. A missing `.next/BUILD_ID` is the quickest
way to recognise this state — Next.js writes that file first.

**Never leave temporary files in the release directory.** The dirty-tree guard
counts untracked files, so parking a broken build as `.next.failed-<date>`
inside the release stops **every** deployment. Keep salvage copies in
`/var/backups/`.

**A backup of `.next` can be self-inconsistent.** `static/` comes from a build
while `server/app/` is rewritten at runtime by ISR, so a backup taken hours
after a deployment can hold two different builds — the prerendered HTML asks for
chunk filenames the same backup does not contain. Take it immediately after a
deployment, or exclude `server/app`.

**A stale chunk 404 usually is not a missing file.** Hashed names change on
every build; a browser holding older HTML asks for filenames that no longer
exist, and the fix is a hard refresh. Compare the prefix before assuming files
were lost.
