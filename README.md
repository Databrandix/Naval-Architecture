# Sonargaon University — Department of Naval Architecture

The public website for the Naval Architecture department at Sonargaon
University, together with the admin dashboard that runs it.

Almost nothing on the public site is hard-coded. Faculty, programmes, news,
notices, events, galleries, clubs, transport routes, page heroes and the
footer all come out of the database, and each has a form behind `/admin`.
Editing the site is an administrator's job, not a developer's.

**Live:** https://naval-architecture-eosin.vercel.app

---

## Stack

| Layer | What we use |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, Motion for animation |
| Database | PostgreSQL on Neon, via Prisma 6 |
| Auth | Better Auth (admin only — the public site has no accounts) |
| Media | Cloudinary (images and PDFs) |
| Email | Resend, for contact-form delivery (optional) |
| Hosting | Vercel |

---

## Running it locally

**You need:** Node.js 18.18 or newer, and a PostgreSQL database. Neon's free
tier is what production uses.

```bash
npm install
cp .env.example .env      # then fill it in — see the next section
npm run db:migrate        # creates the schema
npm run db:seed           # seeds content + the first admin account
npm run dev               # http://localhost:3000
```

The admin dashboard is at `/admin`. Sign in with the
`INITIAL_SUPER_ADMIN_*` credentials you put in `.env`; the seed creates that
account once, so remove those two variables afterwards.

### Environment variables

Every variable is listed with a comment in [`.env.example`](.env.example).
The two worth explaining here:

- **`DATABASE_URL` and `DIRECT_URL`** are both required and they are not the
  same string. `DATABASE_URL` is Neon's *pooled* connection (its hostname
  contains `-pooler.`) and is what the app runs queries through. `DIRECT_URL`
  is the unpooled one, used only by `prisma migrate`, which cannot run
  through a pooler. Swapping them produces migrations that hang.
- **`RESEND_API_KEY`** may be left blank. Contact submissions are always
  written to the database; without a key they simply are not emailed on, and
  the admin list shows why.

Note that `CLOUDINARY_UPLOAD_FOLDER` is what keeps this department's uploads
apart from its sibling sites in the shared Cloudinary account. Production
uses `sonargaon-naval`. Point a second environment at the same folder and the
two will write over each other.

### Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | `prisma generate` then a production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:seed` | Seed content and the bootstrap admin |
| `npm run db:studio` | Prisma Studio, for looking at rows directly |

---

## How the code is laid out

```
src/
├── app/
│   ├── (public)/         Everything a visitor sees. This route group
│   │                     carries `export const revalidate = 3600`.
│   ├── admin/
│   │   ├── (authed)/     ~50 sections, one per kind of content
│   │   └── login/
│   └── api/              Auth, contact, newsletter, club applications,
│                         CSP reports, and the admin upload endpoints
├── components/
│   ├── layout/           Navbar, Footer, PageShell (hero + breadcrumb)
│   ├── sections/         Homepage sections
│   ├── admin/            Form controls shared across admin screens
│   └── ui/               Button, Container, and friends
├── lib/
│   ├── admin-actions/    Server actions behind the admin forms
│   ├── db.ts             The Prisma client singleton
│   ├── identity.ts       Cached reads of the singleton content rows
│   ├── validation.ts     Zod schemas shared by forms and actions
│   ├── cloudinary.ts     Signed-upload params; see the note below
│   └── *-data.ts         Fallback content for pages not yet in the CMS
├── middleware.ts         Guards /admin
└── prisma/
    ├── schema.prisma     ~58 models
    └── migrations/       Applied in order; never edit an applied one
```

Adding a public page means adding a folder under `src/app/(public)/`. It
inherits the navbar, footer and page transition from the group layout. If it
should appear in the breadcrumb trail with a readable name, add its section
to `src/lib/breadcrumb.ts` — sections with no page of their own are listed
there too, so the trail reads correctly without linking to a 404.

---

## Deploying

Vercel hosts the site and builds it automatically on every push to `main`.
Nothing else is needed for a normal change.

Set the same environment variables in the Vercel project settings that you
have in `.env`, with `BETTER_AUTH_URL` pointing at the production domain.

If you ever need to force a rebuild without a code change — after editing
content straight in the database, say — an empty commit is enough:

```bash
git commit --allow-empty -m "chore: rebuild" && git push
```

---

## Things that will surprise you

A few behaviours are deliberate but not obvious. Each of these has cost
someone an afternoon.

**Pages are cached for an hour.** `(public)/layout.tsx` sets
`revalidate = 3600`. Saving through an admin form is fine — those actions
call `revalidatePath` and the page updates at once. Editing a row *directly
in the database* does not, so the old page can stay up for an hour. Push an
empty commit, or make the change through the dashboard.

**Images in the database and files in `public/` must ship together.** A
content row can point at either a Cloudinary URL or a repository file. If it
points at a repository file, that file has to be committed *and* deployed, or
production gets a 404 while local looks perfect. Cloudinary avoids this
entirely, which is why uploads go there.

**Cloudinary stores the original.** `signUploadParams` deliberately signs no
transformation, so the bytes uploaded are the bytes stored. The quality
preset an administrator picks is applied by inserting a transformation
segment into the delivery URL before it is saved. Delivery preferences can
therefore be changed later without re-uploading anything.

**Hero crops are set per page, not baked into the image.** Heroes store a
vertical percentage alongside the URL. Crop a photo to banner shape and the
people at the edges are lost on narrow screens; leave it whole and move the
percentage instead.

**Migrations run against a real database.** `prisma migrate dev` needs
`DIRECT_URL`, and on Windows it will fail with `EPERM` on
`query_engine-windows.dll.node` if a dev server is holding the engine. Stop
the dev server first.

---

## Sibling projects

The Mechanical Engineering department site is the same codebase with
different content and its own database. Fixes to shared components —
`PageShell`, `Footer`, `breadcrumb.ts` — usually belong in both. One
difference to remember: that project is **not** wired to deploy on push, so
a change there needs `npx vercel deploy --prod` as well.
