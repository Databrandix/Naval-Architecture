# Phase 14 — Cloudinary delivery quality preference (per-upload admin choice)

Tiny, surgical phase. Storage stays original, delivery becomes admin-choosable per upload, existing assets are untouched.

- **Storage**: ALWAYS original — `signUploadParams` signs only `timestamp + folder`, no `format` or transformation, so Cloudinary keeps the source bytes
- **Delivery**: per-upload admin picks one of 3 presets in the new "Delivery quality" radio inside ImageUploader. The chosen transformation segment is baked into the Cloudinary `secure_url` BEFORE the URL lands in the DB
- **Renderer**: zero changes across 40+ models — the DB stores a self-describing delivery URL, public pages keep using `<img src={dbUrl}>`. Pre-Phase-14 URLs serve as-is (no segment) for full backward compatibility

Zero schema migration. Zero new dependencies. ~130 LOC added across 3 files.

---

## Empirical baseline (before Phase 14)

Same hero image from the live homepage, served straight from `/upload/v.../file.jpg` with no transformation:

| Request | Content-Type | Size |
|---|---|---|
| Current URL (no segment), Chrome Accept (AVIF/WebP) | image/jpeg | **562,878 B** |
| `+f_auto,q_auto:good`, Chrome Accept | image/jpeg | 336,958 B (−40%) |
| `+f_auto,q_auto:eco`, Chrome Accept | image/webp | 255,420 B (−55%) |

So `f_auto,q_auto:good` was real money on the table — Phase 14 is the thing that lets admins claim it per upload, while keeping the "Original" escape hatch for logos, diagrams, and text-heavy images where compression artefacts matter.

---

## Decisions A–G — outcomes

| # | Decision | Outcome |
|---|---|---|
| **A** | Preset list | 3 presets, all approved: `original` (no segment), `auto` = `f_auto,q_auto:good` (recommended for photos), `auto_compact` = `f_auto,q_auto:eco` (max compression) |
| **B** | Default preset | `auto` — visible bandwidth win for ~95% of photo uploads; admins override for the 5% logo/diagram cases |
| **C** | Storage strategy | ALWAYS original — already true today; locked the invariant with a comment block in `src/lib/cloudinary.ts` so future contributors don't accidentally add eager transformation |
| **D** | Persistence | **D2 — runtime URL-baked**. Transformation segment inserted into `secure_url` BEFORE the URL is saved to the DB. Chosen over D1 (per-field DB column on 40+ models) to avoid schema migration churn, and over D3 (Cloudinary named transformations) to avoid dashboard config drift |
| **E** | Renderer pattern | No renderer changes. DB URL is self-describing — public pages keep `<img src={dbUrl}>` |
| **F** | UI placement | Universal — every ImageUploader instance gets the radio (hidden only when `accept === "application/pdf"`, since `f_auto`/`q_auto` have no useful effect on PDFs) |
| **G** | Backward compatibility | Pre-Phase-14 stored URLs have no transformation segment → continue serving exactly as before. Existing ~50 uploaded assets untouched |

---

## File inventory (1 commit, 3 files, +130 / −3)

| File | Why |
|---|---|
| **`src/lib/image-quality.ts`** (NEW) | 3-preset enum, label map, `DEFAULT_IMAGE_QUALITY_PRESET = 'auto'`, and `applyDeliveryTransformation(url, preset)` — a pure function that inserts the `f_auto,q_auto:*` segment between `/upload/` and `/v<version>/` in a Cloudinary URL. Returns the input unchanged for `original`, non-Cloudinary URLs, or already-transformed URLs (regex guard) |
| `src/lib/cloudinary.ts` | Comment block locks the storage-original invariant — no `format` or transformation params signed; Cloudinary keeps the source bytes. Helper signatures untouched |
| `src/components/admin/ImageUploader.tsx` | `useId` for per-instance radio group name. New `quality` state defaulting to `auto`. On upload, the chosen preset is baked into `secure_url` via `applyDeliveryTransformation` BEFORE state/`onChange` fires (PDFs pass through unchanged). New fieldset rendered below the file picker — hidden only for pure-PDF `accept="application/pdf"`. Backward compatible: any form not passing `qualityOptions` (none of them do — `qualityOptions` is the radio itself, universal) still saves a URL, just now optionally with a transformation segment |

**Total: 130 LOC across 3 files, single commit `588e680`.**

---

## Mid-phase incident — dev server worker crash (unrelated)

Caught during the localhost verify gate:

1. Chair completed first round-trip upload on an event form — `POST 200`, image saved with new transformation segment ✓
2. On a subsequent compile of `/news/[slug]`, the Next.js 15.5.x dev worker pool crashed: `Jest worker encountered 2 child process exceptions, exceeding retry limit`
3. All subsequent requests returned `500` until a clean restart

Diagnosis: **Phase 14-unrelated**. Known Next.js 15.5.x recurring Windows-dev-mode bug (the dev worker pool uses jest-worker internally; on certain HMR cycles + parallel page compilations it dies and doesn't recover). The first POST 200 proved the Phase 14 code path was working end-to-end before the crash hit.

Fix: kill the dev process, restart. Production builds use a different code path (no jest-worker dev pool) and are unaffected. No memory entry warranted — environmental, not architectural.

---

## Verification log

| Stage | Verification |
|---|---|
| Schema | No migration — D2 means zero DB column changes |
| Local typecheck | `npx tsc --noEmit` clean |
| Local curl sanity | `/admin/login`, `/`, `/about/deans-message`, `/contact` → 200; `/api/admin/uploads/sign` unauthed → 401 (auth gate intact) |
| Browser verify (chair) | "Delivery quality" radio visible in admin forms, default Auto-optimized selected. Round-trip on event form: image uploaded with `auto`, public `/student-society/events` reflected the new URL after revalidate. Pre-Phase-14 images on `/`, `/contact`, `/about/*` visually identical (no regression) |
| Production deploy | `dpl_3su2Eij8pT3YCgCVN413G7rxM36a` → aliased to `mechanical-engineering-olive.vercel.app`. Build clean: 206 pages generated, no warnings |
| Prod sanity | 9 public surfaces 200; `/admin/login`, `/student-society/events`, `/news` 200; existing pre-Phase-14 hero image still serves identical bytes (562,878 B JPEG) — backward-compat regression check clean |
| Chair prod browser | Verified post-deploy on live URL |

---

## Out of scope (deferred)

- Re-processing existing ~50 Cloudinary assets — chair confirmed: future uploads only, no mass migration
- AVIF eager generation in upload helper — relies on Cloudinary's on-demand `f_auto` AVIF instead (no extra storage credit)
- Video / PDF transformation tuning — `resource_type='image'` scope only
- Per-entity quality defaults — universal radio + per-upload override is the agreed pattern; per-entity presets were deemed over-engineering
- Storing the chosen preset in a queryable DB column — D2 means preset can be derived by URL-parsing if ever needed; no schema bloat today

---

## Test plan checklist (for PR review)

- [ ] Pull branch + `npm install` (no new deps)
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run dev`:
  - [ ] Open any admin form with an ImageUploader (e.g. `/admin/faculty/<id>`, `/admin/department-identity`, `/admin/journey-cta`, `/admin/events/<id>`)
  - [ ] "Delivery quality" fieldset visible below file picker, **Auto-optimized** preselected, helper text legible
  - [ ] PDF-only forms (e.g. `/admin/syllabus/new` if its uploader is `accept="application/pdf"`) — radio hidden
- [ ] Round-trip — three presets:
  - [ ] **Auto-optimized**: upload → save → public page DevTools Network → image URL has `/upload/f_auto,q_auto:good/v.../`, Content-Type `image/webp` or `image/avif` (browser-dependent), size noticeably smaller than original
  - [ ] **Original**: upload → save → URL has no transformation segment, Content-Type matches uploaded format, full size
  - [ ] **Maximum compression**: upload → save → URL has `/upload/f_auto,q_auto:eco/v.../`, smallest delivered size
- [ ] Regression on pre-Phase-14 assets:
  - [ ] Homepage 3-image hero carousel — identical bytes / visual
  - [ ] `/about/deans-message`, `/about/message-from-head` hero — identical
  - [ ] `/contact` hero — identical
  - [ ] `/faculty-member` + `/faculty-member/<slug>` photos — identical
- [ ] No new dependencies (`package.json` / `package-lock.json` unchanged)
- [ ] `prisma migrate status` clean (no Phase 14 migration — D2 is URL-only)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
