# Phase 0 — Backend foundation, admin CMS, image uploads

## Scope

A self-contained admin CMS layered onto the existing public Next.js site. Everything below ships in a single feature branch and deploys to the same Vercel project as the public site.

- **Database & ORM** — Prisma schema with auth tables (`User`, `Session`, `Account`) and content singletons/lists (`DepartmentIdentity`, `UniversityIdentity`, `Program`, `ResearchArea`). Initial migration applied to Neon.
- **Authentication** — Better Auth (email + password only). `disableSignUp: true`, no email verification, no OAuth, no admin plugin. Custom bcryptjs hashing (12 rounds). Two roles: `super_admin`, `admin`. `isActive` gates sign-in via a `databaseHooks.session.create.before` hook.
- **API routes** — 17 routes covering content CRUD + reorder, admin user management, dashboard stats, Cloudinary signed-upload + delete, and Better Auth's catch-all. All routes use `withErrorHandling` + Zod validation. Origin-check CSRF protection via Better Auth's built-in middleware.
- **Safety rule** — "Never let the active super_admin count drop below 1." Enforced uniformly across delete-user, deactivate-user, demote-user, and change-role flows. Surfaced as a clean 400 with a human-readable message.
- **Admin shell** — Route group `src/app/admin/(authed)/*`. Server-side session validation in the (authed) layout. Public chrome (Navbar/Footer/JourneyCTASection) suppressed on `/admin/*` via middleware-injected `x-pathname` header + server-side conditional in the root layout — no client `usePathname` guards. `robots.txt` blocks `/admin/`. `noindex,nofollow` meta on admin pages.
- **Content management UIs** — Four content surfaces (`/admin/department-identity`, `/admin/university-identity`, `/admin/programs`, `/admin/research-areas`) with native HTML forms, server actions, Zod-validated submission, drag-to-reorder via `@dnd-kit`, and Cloudinary signed-upload integration. Toast feedback via `sonner`.
- **User management** — `/admin/users` list + `/admin/users/new` + `/admin/users/[id]` edit (name, role, isActive, delete, reset-password). Super-admin-only, enforced server-side. Self-service `/admin/change-password` for any logged-in admin.
- **Image uploads** — Cloudinary signed-upload flow: server returns `{signature, timestamp, folder, apiKey, cloudName, uploadUrl}`; browser POSTs the file directly to Cloudinary; UI persists the returned `secure_url` + `public_id`. Per-deployment folder isolation via `CLOUDINARY_UPLOAD_FOLDER` env var.

## Out of scope (deferred to later phases)

- Automated test suite (unit, integration, E2E). All verification in Phase 0 is manual: curl smoke + browser flows.
- Email-based password reset / forgot-password. Super-admin uses the admin `reset-password` flow on a user's behalf.
- Audit log of admin actions.
- Public-facing changes that consume the CMS data (programs page wiring, research-areas page wiring, dynamic department/university identity rendering). Public pages still read from static files; switching the source happens in a follow-up phase to keep the diff bounded.
- Email verification, OAuth, magic-link, sign-up — all disabled by config.
- Multi-tenant / multi-department features. The Cloudinary folder env var is the only seam left for cloning per-department.

## Architectural decisions

### Server-header chrome detection (not client `usePathname`)

The first CP5.1 attempt used `usePathname` guards inside the three chrome components (Navbar, Footer, JourneyCTASection) to hide them on `/admin/*`. This caused SSR/client divergence: the server rendered chrome (because `usePathname` returns `null` during SSR), then the client hid it after hydration. Net effect was hydration mismatches and "public chrome leak" on soft navigation into `/admin/*` routes.

The final pattern: `src/middleware.ts` injects an `x-pathname` request header on every request; the root layout reads that header server-side and renders the chrome conditionally. The three chrome components no longer know anything about admin routes. SSR and client agree by construction. This is now the canonical pattern in the repo — see commit `fa1a187`.

### Server actions wrap API routes (not duplicate logic)

The admin UI uses server actions (`src/lib/admin-actions/*.ts`) that call the same validation + Prisma logic as the API routes. The API routes were built first (CP4) so external clients (e.g., a future mobile admin app or scripted batch import) could share them. The server actions are thin wrappers — they share Zod schemas from `src/lib/validation.ts` and helpers from `src/lib/auth-server.ts`.

One exception: `changeOwnPasswordAction` calls `auth.api.changePassword` directly rather than the corresponding HTTP route, because Better Auth's sensitive-session middleware already handles the session-validity check.

### Better Auth `additionalFields` with `input: false`

`role`, `isActive`, and `lastLoginAt` are declared as `additionalFields` on the Better Auth user, all marked `input: false`. This means the Better Auth public API (sign-in body, etc.) cannot write them — they can only be set through our own `/api/admin/users` routes. Prevents privilege escalation via the public auth surface.

### Cloudinary direct upload, not server proxy

Files go from browser → Cloudinary directly, not browser → our server → Cloudinary. Saves us from streaming large files through Vercel's request body limits and from configuring multipart parsing. The server's only job is to mint a short-lived signature for each upload kind. `CLOUDINARY_API_SECRET` never leaves the server.

### Prisma Client Extension with adapter type cast

`src/lib/db.ts` defines a `prismaAdapter`-incompatible extended client (its TS type is wider than the bare `PrismaClient` that `prismaAdapter` expects). Runtime behavior is identical, so we do an explicit `as unknown as Parameters<typeof prismaAdapter>[0]` cast in `auth.ts`. Documented inline. Will lift cleanly when Better Auth widens the adapter generic upstream.

## Verification

All verification in Phase 0 is **manual** — curl + browser. Test suite ships in a later phase.

**Curl smoke tests (CP4 era, repeatable):**
- Public 200 / chrome present
- `/admin` without cookie → 307 → `/admin/login`
- `/admin/login` 200, form renders
- `POST /api/auth/sign-in/email` → 200 + Set-Cookie
- `GET /admin` with cookie → 200, dashboard renders + 'Manage Admins' link visible for super_admin
- `/robots.txt` contains `Disallow: /admin/`

**Browser flows verified end-to-end (CP5.1–CP5.3):**

| Area | Flow | Status |
|------|------|--------|
| Chrome | Public homepage → admin login → dashboard → public (soft + hard nav). No chrome leak in any direction. No hydration warnings. | ✓ |
| Auth | Sign-in (correct), sign-in (wrong password), sign-in (inactive account), logout. | ✓ |
| Content — Department Identity | Edit text fields + colors, upload + clear logo, upload + clear hero images. Persistence verified via reload. | ✓ |
| Content — University Identity | Edit address, phones, emails (one-per-line textareas), 8 social URLs, footer logo. Empty-to-null normalization verified. | ✓ |
| Content — Programs | Create, edit, delete, reorder (drag), image upload + clear. `displayOrder` auto-append on create. | ✓ |
| Content — Research Areas | Create, edit, delete, reorder. Icon dual-mode: Lucide-name vs uploaded image. Schema refine blocks both/neither. | ✓ |
| User mgmt | Create test admin via UI. Edit (name, role, isActive). Delete. Reset password. All super-admin-only. | ✓ |
| Role boundary | Test admin: 'Manage Admins' nav hidden, `adminUsersCount` stat hidden, direct visit to `/admin/users` → server-rendered access-denied UI (not 404, not blank). Programs/research-areas/identity surfaces accessible. | ✓ |
| Safety rule | Super-admin self-demote / self-deactivate / self-delete attempts → 400 with the canonical "system must have at least one active super_admin" message surfaced inline (not silent 500). | ✓ |
| Self-service | `/admin/change-password` — correct current password → success toast. Wrong current → readable error toast. Mismatched new/confirm → action-level error. | ✓ |
| Image uploads | Per-kind folder routing verified in Cloudinary console (`<root>/department/logo`, `<root>/department/hero`, `<root>/university/logo`, `<root>/programs`, `<root>/research-areas`). Orphan-delete on clear. | ✓ |

**One mid-flight bug found and fixed during verification:** `changeOwnPasswordAction` had four lines of post-success scaffolding (`getSession()` + `revalidatePath`) outside its `try` block. Those lines were dead — the comment claimed `/admin/me` cache invalidation but the `revalidatePath` targeted the current page, and Better Auth's default `revokeOtherSessions: false` has no cookie side effects that would require revalidation in the first place. Worse, the unwrapped `getSession()` was a candidate for the "An unexpected response was received from the server" error on submit. Fixed in commit `290a8a3`.

## Tech debt notes

Surfaced during Phase 0; not blocking deployment, but worth tracking for future phases.

- **`getSession()` duplication across pages and the (authed) layout** — the layout already validates and redirects on missing session, but every child page re-calls `getSession()` for its own role checks. Eighteen call sites in total. Next.js dedups per-request at runtime, so no perf cost, but semantic duplication. Future fix: `React.cache()`-wrap `getSession` or pass session as a prop from layout.
- **Prisma 6 adapter type cast** — `src/lib/auth.ts:14`. Documented inline; lifts when Better Auth widens its adapter generic.
- **No automated tests** — Phase 0 ships with zero tests. Risk: regression on a future change goes unnoticed until manual verification. Suggested phase: Vitest for API integration, Playwright for the role-boundary + safety-rule smoke trace.
- **`changeOwnPassword` accepts `newPassword === currentPassword`** — Better Auth's endpoint does not block this. Self-only flow, so security impact is nil, but UX is mildly confusing. Future fix: add a server-action guard.
- **Local-only edit on `src/app/admission/requirements/page.tsx`** — carried unstaged through CP3–CP5 by design. Owner handles separately. Not in this PR.
- **CRLF warnings on every commit** — cross-platform (Windows dev + Linux CI/runtime). `.gitattributes` with `* text=auto eol=lf` would silence and prevent EOL drift. Low priority.

## Commit list

```
290a8a3 fix(phase-0): CP5.3 — drop unwrapped post-success scaffolding from changeOwnPasswordAction
15c330b feat(phase-0): CP5.3 — user management + self-service + a11y sweep
fa04f29 feat(phase-0): CP5.2 — content management UIs (4 sections)
fa1a187 fix(phase-0): CP5.1 — replace client usePathname guards with server-header-based chrome detection
a662450 fix(phase-0): CP5.1 — public chrome leak on /admin (Rules of Hooks ordering)
73483b6 feat(phase-0): CP5.1 — admin shell, login, layout, dashboard
e8dfd7c feat(phase-0): CP4 — API routes, admin endpoints, Cloudinary uploads
bfdaee9 feat(phase-0): backend foundation — schema, auth, seed
```

8 commits — 5 feat, 3 fix. Diff vs `main`: **72 files changed, +10,258 / -680**.

## Deployment readiness

**Vercel environment variables** (set via CLI before this PR opens):

| Variable | Production | Preview | Development |
|---|---|---|---|
| `DATABASE_URL` | ✓ (Neon integration) | ✓ | ✓ |
| `DIRECT_URL` | ✓ | ✓ | ✓ |
| `BETTER_AUTH_SECRET` | ✓ | ✓ | ✓ |
| `BETTER_AUTH_URL` | `https://mechanical-engineering-olive.vercel.app` | — (skipped) | `http://localhost:3000` |
| `CLOUDINARY_CLOUD_NAME` | ✓ | ✓ | ✓ |
| `CLOUDINARY_API_KEY` | ✓ | ✓ | ✓ |
| `CLOUDINARY_API_SECRET` | ✓ | ✓ | ✓ |
| `CLOUDINARY_UPLOAD_FOLDER` | `sonargaon-me` | `sonargaon-me` | `sonargaon-me` |

`INITIAL_SUPER_ADMIN_*` are local-bootstrap only and are intentionally not propagated to Vercel.

**Better Auth production checks** (verified against `node_modules/better-auth` source):

- `trustedOrigins` does not need to be declared in `auth.ts`. `context/helpers.mjs:73` automatically pushes `new URL(baseURL).origin` to the trusted list. Our production `BETTER_AUTH_URL` covers it.
- Session cookies are auto-promoted to `secure: true` when `baseURL` starts with `https://`. See `cookies/index.mjs:20`.
- Origin-check CSRF middleware runs on all non-GET/HEAD/OPTIONS auth API requests with cookies — already wired via `toNextJsHandler`.

**Cloudinary production check:** the signed-upload endpoint (`/v1_1/<cloud>/auto/upload`) is CORS-permissive by default. Verify the Cloudinary dashboard does not have a manually-set "Allowed upload origins" restriction; if it does, add the production hostname.

**Deploy plan:** production deploy from this feature branch (`vercel deploy --prod`) without first merging to `main`. PR stays open as draft for git record-keeping until production browser verification passes. After verification, the PR is moved to ready-for-review and the human owner makes the final merge decision.
