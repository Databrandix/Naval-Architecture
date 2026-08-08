# Phase 9 — Contact Form Backend (Path B: email + DB log)

**First demand-driven phase after the PROJECT CMS-COMPLETE milestone (PR #11).**

The Mechanical Engineering CMS migration formally closed with Phase 8c. This PR is the first post-handover delta: a functional gap, not a content one. The `/contact` page had a form with a simulated submit handler; submissions silently vanished. Phase 9 wires that surface to a real backend with both DB persistence (the audit + admin source-of-truth) and email notification (the operations side).

---

## Why this is the right scope (Path B, not A or C)

| Option | Why rejected for this phase |
|---|---|
| **Path A — email only** | Loses submissions if Resend dispatch fails for any reason (key rotation lag, free-tier exhaustion, transient API outage). No admin visibility into what was attempted. |
| **Path C — full CRM** (assignments, internal threads, SLA timers, etc.) | Over-engineered for dept-site demand. Defers easily until real usage shows the gap. |
| **Path B — email + DB log (this PR)** | DB is the source of truth; email is best-effort. Admin always has visibility via `/admin/contact-submissions`, even when email is misconfigured or unset. Smallest viable surface that doesn't lose data. |

---

## Decisions A–F — surfaced before execution, chair-approved

| # | Decision | Outcome |
|---|---|---|
| **A** | Rate-limit strategy | In-memory IP Map, **3 submissions / hour / IP**. Process-local — restart resets. Acceptable for dept-site scale; Redis upgrade path open if abuse appears. |
| **B** | Spam protection | **Honeypot only this phase** (hidden `website` input — bots fill, humans don't). reCAPTCHA explicitly deferred — added complexity + Google account requirement until real spam emerges. |
| **C** | Admin notification UX | **Dashboard stat card** (`New Contact Submissions`) **+ sidebar badge** showing the unread count. No separate notification system. |
| **D** | Public submission UX | **In-form success state** (no email confirmation to submitter). Preserves Resend free-tier quota; matches the legacy `submitted` state already in `ContactForm.tsx`. |
| **E** | Email template | **Single inline-styled HTML** template in `src/lib/email.ts`. No template engine. Resend renders raw HTML; SU brand color + Reply-To wired correctly so admin can reply directly from inbox. |
| **F** | Sidebar placement | **Top-level `Contact Submissions` entry with badge**, not nested under any content group. Operational, not content. Single-entity surface — no "Operations" group needed yet. |

---

## Schema additions (one migration)

`20260518095625_add_contact_submissions`. No foreign keys to Phase 0–8c tables; one column added to `UniversityIdentity`.

### `ContactSubmission` (multi-row audit log)

| Column | Type | Notes |
|---|---|---|
| `id` | cuid PK | |
| `name` / `email` / `phone` / `subject` / `message` | String + Text on message | `phone` / `subject` optional. `subject` deliberately kept optional in DB even though current form requires it — gives future-form flexibility without migration. |
| `status` | String enum (`new` / `read` / `archived`) | Default `new`. Zod-validated against the closed set. Same enum-as-string pattern as Phase 6 `News.category`. |
| `submittedAt` | DateTime | Default `now()`. Sort key. |
| `ipAddress` / `userAgent` | both nullable | `x-forwarded-for` first hop + raw UA. Nullable for misconfigured proxy / curl scenarios. |
| `emailSentAt` | DateTime? | Null = email skipped OR failed. Populated on successful Resend dispatch. |
| `emailError` | Text? | Skip reason (`skipped: RESEND_API_KEY not configured` / `skipped: No recipient configured (...)`)  OR Resend error message. Null on success. |
| `@@index([status, submittedAt])` | composite | Drives the admin filter view. |
| `@@index([submittedAt])` | scalar | Fallback chronological ordering. |

### `UniversityIdentity.contactSubmissionEmail` (new column)

- Single nullable String. Admin sets in `/admin/university-identity` → new "Contact form" Card.
- **Null = email delivery disabled** (DB-only mode). Submissions still persist; dispatch helper records the skip reason in `emailError`.
- Validated as email-or-empty in `universityUpdateSchema`; empty string normalized to `null` on save.

---

## New runtime dependency — `resend`

**First non-zero-dep phase since project bootstrap.** Documented as a deliberate exception to the previous phases' zero-dep posture:

| Argument | Detail |
|---|---|
| Why an SDK over raw SMTP fetch | Type-safe templates · automatic SPF/DKIM headers when the sender domain is verified · graceful error semantics (clear `result.error` vs. caught exceptions) · `replyTo` first-class · free-tier signals (rate caps, sender constraints) baked in. Hand-rolling SMTP/HTTPS to api.resend.com works but each of those would be re-implemented poorly. |
| Why Resend specifically | Modern dev-friendly · free tier (100 emails/day) fits dept-site usage · the `onboarding@resend.dev` test sender allows graceful first deploy without domain verification (later swap to e.g. `noreply@me.su.edu.bd`). |
| Bundle impact | ~50 KB SDK with zero additional peer deps; isolated to the server-side `src/lib/email.ts` wrapper. |

`package.json` diff: `+1` dep (`resend`). Zero changes to anything else under `dependencies` / `devDependencies`.

---

## Graceful degradation — the email never blocks the form

The dispatch helper returns a three-state result (`sent | skipped | failed`). Behavior:

| Scenario | DB row | `emailSentAt` | `emailError` | HTTP response |
|---|---|---|---|---|
| Both `RESEND_API_KEY` set + recipient set | ✓ created | populated | null | `200 {ok:true}` |
| `RESEND_API_KEY` missing in env | ✓ created | null | `skipped: RESEND_API_KEY not configured` | `200 {ok:true}` |
| `RESEND_API_KEY` set, recipient null | ✓ created | null | `skipped: No recipient configured (...)` | `200 {ok:true}` |
| Resend SDK error (network / quota / etc.) | ✓ created | null | Resend error message | `200 {ok:true}` |
| Validation fail (e.g. missing email) | ✗ | — | — | `400` with Zod issue path |
| Honeypot tripped (`website` field non-empty) | ✗ (silently dropped) | — | — | `200 {ok:true}` (bot doesn't know) |
| Rate limited (>3 / hr / IP) | ✗ | — | — | `429` with `Retry-After` header |
| GET on the submit endpoint | — | — | — | `405` |

**Submission survives all email-side failures.** Admin always sees the row + the skip/error reason; no in-flight submission is ever lost to an email-side glitch.

---

## File inventory (3 commits)

| Checkpoint | Commit | Files | Highlights |
|---|---|---|---|
| **CP9.1** — schema + Resend wrapper + rate-limit + .env.example | `203af8f` | 9 | `ContactSubmission` model + `UniversityIdentity.contactSubmissionEmail` + migration + Resend wrapper + in-memory rate limiter + Zod schemas (`contactSubmissionCreateSchema`, `contactStatusEnum`) + first `.env.example` (also documents existing Neon/BetterAuth/Cloudinary surfaces) |
| **CP9.2** — public submit API + admin layer | `788b14b` | 10 | `/api/contact/submit` (honeypot → rate-limit → Zod → store → dispatch) · admin server actions (status update + delete) · `/admin/contact-submissions` list with 3 status tabs · `/admin/contact-submissions/[id]` detail with audit metadata + client-side action buttons · `/admin/university-identity` extended with "Contact form" Card · sidebar top-level entry with unread badge · 2 dashboard StatCards + 1 ActionCard |
| **CP9.3** — public form wire + honeypot + error states | `57c291e` | 1 | `ContactForm.tsx` POSTs to `/api/contact/submit`; hidden `website` honeypot input (off-screen, off-tab-order, aria-hidden); error banner for 400/429/500/network; success copy updated from "email delivery being set up" to the post-deploy message |

**Total Phase 9 surface:** 20 files changed, +1070 / −9.

### Files NOT changed (deliberate)

| File | Why |
|---|---|
| `src/lib/search-index.ts` | `ContactSubmission` is **never search-indexed**. Personal contact data is admin-only by design. `/contact` page itself was already in the static-pages list — no change. |
| `src/app/sitemap.ts` | `/contact` already listed at priority 0.7 — no change. |
| Any Phase 0–8c table or page | Per constraint #4 — Phase 9 only adds one new column to `UniversityIdentity`. |

---

## Verification log

| Checkpoint | Verification |
|---|---|
| CP9.1 | Migration applied clean (Neon prod DB now has `contact_submission` table + 2 indexes + 1 new column on `university_identity`). Prisma Client regenerated. Typecheck 0 errors. |
| CP9.2 | Local curl 3-test: valid → 200 + row stored; honeypot → 200 + no row; missing email → 400 with Zod issue. Admin routes → 307 auth. GET on submit → 405. DB row showed `emailError: skipped: RESEND_API_KEY not configured` (graceful degradation working). Chair browser-verified all 5 admin surfaces + sidebar badge + dashboard stats + UniversityIdentity recipient field. |
| CP9.3 | Local curl tests: empty honeypot → 200 + row; honeypot tripped → 200 + no row. Typecheck clean. Chair browser-verified the form-submit → success-state flow + hidden honeypot field via DevTools + error banner path. |
| CP9.4 | `vercel env add RESEND_API_KEY` set on Production + Preview (this branch). DB cleaned (0 rows) pre-deploy. `vercel deploy --prod` → deployment `dpl_88GjDiYbux3ZkJwaS1MeZWRTBZzN` READY at `https://mechanical-engineering-olive.vercel.app`. Production curl 6/6 green: POST valid → 200 + row stored + real IP captured (`45.248.148.218`); POST honeypot → 200 + no row; GET `/contact` → 200; admin routes → 307; `/admin/login` → 200; GET on submit → 405. DB showed `emailError: skipped: No recipient configured` (RESEND_API_KEY present, recipient still null — Stage 1 graceful skip path verified live). Chair production-verified. |

---

## Security notes

**Read carefully — these reflect a deliberate chair decision and are not standard practice for production secrets.**

- `RESEND_API_KEY` was shared in the development chat per a chair-approved decision (rotation acknowledged but deferred). The key is now set as an encrypted Vercel environment variable on Production + Preview for this branch.
- **Blast-radius bound:** Resend free tier caps at **100 emails/day**, which is the maximum window of abuse if the key is misused before rotation. Below the threshold that would cause material harm to the dept.
- **Operational monitoring:** Watch the Resend dashboard (`resend.com → Logs`) for unexpected usage spikes. Rotate the key immediately if any signal appears (sudden burst of failed deliveries from unknown senders, daily-cap exhaustion not matching real submission traffic, etc.).
- **Future-secret hygiene:** Going forward, prefer `vercel env add` interactive flow (no value flag) or the Vercel dashboard for secret entry — not chat sharing. The CLI plugin's `--value` flag echoes the secret to shell history; safer alternatives exist.
- **Server-side discipline still applies** regardless of how the key was set: the code never logs the key, never includes it in error fields, never echoes it in responses. The wrapper reads `process.env.RESEND_API_KEY` at dispatch time and silently degrades when missing.

---

## Out of scope (Phase 10+ if demand emerges)

- **reCAPTCHA / hCaptcha** — honeypot is enough for current spam vector. Add when real spam appears.
- **Email confirmation to submitter** — would consume ~2× the Resend quota and require submitter copy template. Defer.
- **Admin reply-from-panel** — admin currently replies via mailto:/Gmail. In-panel reply would need outbound email-as-noreply config + thread tracking.
- **CSV export of submissions** — bulk operations not needed at current row volume.
- **Webhook notifications** (Slack / Discord on new submission) — operationally easy to add via Resend's webhook surface if demand surfaces.
- **Soft-delete / retention policy** — hard-delete chosen for GDPR-friendly posture on personal data. Soft-delete adds operational complexity (retention timer, automatic purge job) without proportional value at current volume.
- **Per-route rate-limit** — current rate limiter is single-route. Reusable middleware would help if more public POST endpoints land.
- **All-preview-branches env var** — Vercel CLI's "all branches" non-interactive add path failed in this session due to a plugin quirk; only the `feat/phase-9-contact-backend` preview branch has the key. Future PRs can either add to their preview branch via CLI, or chair can set "all branches" via the Vercel dashboard once.

---

## Test plan checklist (for PR review)

- [ ] Pull branch + `npm install` — confirms `resend` lands in `dependencies`
- [ ] `npx prisma migrate status` clean
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run dev`:
  - [ ] `/contact` form renders pixel-identical to pre-Phase-9 (no visual change — constraint #7)
  - [ ] Submitting a valid form → "Sending…" spinner → green "Thanks for reaching out!" state
  - [ ] DevTools → Elements → search `name="website"` — hidden input at `position: absolute; left: -9999px;` exists, `tabIndex={-1}`, `aria-hidden="true"`
  - [ ] After login, sidebar shows top-level **Contact Submissions** (Mail icon) with unread badge
  - [ ] Dashboard shows the 2 new stat cards (`New Contact Submissions` / `Total Contact Submissions`) and the new ActionCard
  - [ ] `/admin/contact-submissions` — 3 tabs (New / Read / Archived) with counts; click row → detail page with full audit metadata
  - [ ] StatusActions buttons (Mark new / Mark read / Archive / Delete) all work; sidebar badge + dashboard counts reflect changes
  - [ ] `/admin/university-identity` — bottom "Contact form" Card with email recipient input + helper text; saving null + saving valid email both round-trip
- [ ] Bot path: POST `/api/contact/submit` with non-empty `website` → 200 OK, **no row created**
- [ ] Rate limit: 4 rapid valid POSTs from one IP → 4th returns `429` with `Retry-After` header
- [ ] Email path (only if `contactSubmissionEmail` is set):
  - [ ] Submit a real test → email arrives in the configured inbox within seconds
  - [ ] Email subject: `Contact: <subject>` (or `Contact form: <name>` if subject blank)
  - [ ] Email body: SU header banner + sender card + message box + audit table + Reply-Directly footer
  - [ ] Replying to that email targets the submitter's address (`Reply-To` correct)
  - [ ] Admin detail page shows `Email dispatch: ✓ Sent at …`, no error
- [ ] Email skip paths:
  - [ ] If `RESEND_API_KEY` is absent → `emailError: skipped: RESEND_API_KEY not configured`
  - [ ] If `contactSubmissionEmail` is null → `emailError: skipped: No recipient configured (...)`
- [ ] Regression spot-checks:
  - [ ] Phase 0–8c surfaces unchanged on prod (faculty, news, admission/* pages, etc.)
  - [ ] `/admin` dashboard renders all existing stat cards + the 2 new ones
  - [ ] Global search behaves identically (ContactSubmission entries do **not** appear in search results)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
