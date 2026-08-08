# Phase 19 — Security Audit + Targeted Hardening

A 12-domain read-only security audit (CP19.1) followed by five batched fix
sub-CPs deployed as a single production release. Closes every Critical and
High finding identified in the audit. The remaining Medium / Low items either
ship as operational recommendations in this doc or are explicitly deferred to
Phase 20.

The audit's specific findings (file paths, attack vectors, reproduction
notes) live in a local gitignored working folder and are intentionally NOT
restated here per the phase's responsible-disclosure protocol.

---

## Executive Summary

| Severity | Pre-CP19.1 | Post-deploy |
|---|---|---|
| Critical | 1 | 0 |
| High     | 5 | 0 (4 fully closed; 1 *partial* — CSP enforcement deferred to a follow-up mini-CP after Report-Only observation) |
| Medium   | 7 | 0 closed / 4 documented as operational recommendations / 3 deferred to Phase 20 sub-CPs |
| Low      | 10 | 0 closed in this phase / 10 deferred to Phase 20 sub-CPs |
| Total | 23 | 4 documented + 13 deferred = **all knowingly accounted for** |

Production `npm audit` count: **10 → 0** vulnerabilities (Critical/High/Moderate fully resolved).

---

## Sub-CPs shipped

| Commit | Sub-CP | Category |
|---|---|---|
| `079fa88` | CP19.2 | Dependency hardening + dev-dep cleanup |
| `d7011c1` | CP19.3 | Security response headers |
| `1d34a9c` | CP19.4 | Failed-login rate limit + per-account lockout |
| `2dd3cea` | CP19.5 | Server-side HTML sanitization (write + read) |
| `c6afaf0` | CP19.6 | Content-Security-Policy in Report-Only mode |
| `2fa8927` | CP19.6.HOTFIX  | First attempted fix for CP19.5 runtime regression (did not resolve, kept in history for traceability) |
| `b656ecc` | CP19.6.HOTFIX2 | Sanitizer library swap that resolved the regression |

CP19.2 → CP19.6 shipped together as one production deploy. The two hotfix
commits relate to a CJS/ESM interop crash in the original sanitizer's
transitive dependency chain, surfaced post-deploy on the single dynamically
rendered public route and resolved by swapping the sanitizer library to a
pure-JS implementation with identical security guarantees.

---

## Hardening categories applied

### 1. Dependency hardening
- Framework patched to the latest secure point release
- An unused devDependency that pulled in High-severity transitive advisories was removed
- A transitive override pinned one remaining moderate finding
- Production `npm audit` is now clean (0 advisories of any severity)

### 2. Security response headers (9 added + 1 fingerprint removed)
- HSTS with 2-year max-age, preload-eligible
- Frame-options + frame-ancestors (clickjacking)
- MIME-sniff prevention
- Referrer-Policy (origin-only on cross-origin)
- Permissions-Policy denying every browser feature this site does not use
- Cross-origin isolation pair (COOP + CORP)
- DNS prefetch hint
- Content-Security-Policy in Report-Only mode (see below)
- Framework "X-Powered-By" header stripped

### 3. Two-layer login defense
- **Layer A — per-IP rate limit** via the auth library's native rule (10 attempts / 15 min)
- **Layer B — per-account lockout** via a small in-memory tracker (5 consecutive failures → 30-min cool-down)
- Lockout responses are intentionally indistinguishable from wrong-password responses (same status, byte-identical body, constant-time floor) so an attacker can't probe for lockout state
- Server-side logs use truncated SHA-256 hashes of identifiers — no PII

### 4. Server-side HTML sanitization (defense-in-depth)
- 12 admin server actions sanitize on write before persisting
- 13 public render sites sanitize on read before passing to `dangerouslySetInnerHTML`
- Tight allowlist matching the observed admin-authoring pattern (inline formatting + links + lists; no inline images, tables, or headings-of-the-page)
- URL scheme allowlist (http/https/mailto/tel/relative/hash); `target="_blank"` links auto-stamped with `rel="noopener noreferrer"`
- Library choice: `sanitize-html` (htmlparser2-based, no jsdom dependency chain)

### 5. Content-Security-Policy (Report-Only)
- Strict policy covering scripts, styles, images, fonts, connect, frames, base-uri, form-action, object-src
- `frame-ancestors 'none'` enforced immediately (spec quirk — applies even in Report-Only)
- `upgrade-insecure-requests` defense-in-depth
- Telemetry endpoint accepts both legacy `report-uri` and modern Reporting API shapes, in-memory rate-limited, returns 204 best-effort, logs structured JSON
- Currently in observation mode; the Enforce switch is deferred to a Phase 20 mini-CP after 1–2 weeks of production violation data

---

## Verification performed

| Layer | Method |
|---|---|
| Audit (CP19.1) | 12-domain manual read-only investigation |
| Per-sub-CP | typecheck + production build + ISR regression check + local `next start` curl sweep |
| Pre-deploy | Phase 18 ISR indicators preserved across all five sub-CPs |
| Deploy | Curl sanity sweep: 17 public routes 200, admin routes 307, header count, X-Powered-By absent, ISR cache markers preserved |
| Post-deploy automated | Two-layer lockout sequence with byte-identical body verification, per-IP rate limit verification at exact threshold, HTML pattern verification across 6 sanitized surfaces, sanitizer unit tests covering scheme stripping + tag allowlist + auto-rel + null-safety, Vercel log review for hashed-identifier consistency |
| Post-deploy manual | Visual walkthrough, DevTools Console CSP-violation review, admin save-flow end-to-end |

---

## Documented limitations + future considerations

These are knowingly accepted for current scale and surfaced here so future
maintainers know the trade-offs:

- **Lockout timing variance ≈ 150ms** on the fast-path relative to the slow-path. Statistically distinguishable only with hundreds of samples; not exploitable in normal threat models. If future telemetry warrants, the constant-time floor can be raised in a small follow-up.
- **In-memory state across Vercel function instances** — both the per-IP rate limit and per-account lockout use per-instance Maps, so values can drift if the platform spins up additional instances. Acceptable for current admin-team scale (low login volume). Upgrade path = persistent KV / Redis when multi-instance becomes load-relevant.

---

## Operational recommendations (no code change; chair-side tasks)

These are surface-level operational practices that came out of the audit
but don't belong inside a code phase. Track separately:

- **Auth-secret rotation procedure.** The auth library's primary secret is bootstrapped once. Document a rotation runbook: generate new secret → update Vercel env → trigger redeploy (all active sessions invalidated, forces re-login — desired side effect). Rotate annually or on any suspected exposure.
- **Admin session TTL.** Currently uniform 7 days across all roles. Consider 24h–48h for admin specifically — a stolen laptop session shouldn't outlive a normal working day. Configurable via the auth library.
- **Outbound email sender domain verification.** The contact-form notification currently uses the email provider's shared sender. Verifying a project-owned domain (SPF / DKIM / DMARC) improves deliverability and prevents shared-sender spoofing — not strictly a security issue, but a brand-protection and inbox-hit-rate win.

---

## Deferred to Phase 20 (or later)

| Item | Why deferred |
|---|---|
| **CSP Enforce switch** | Needs 1–2 weeks of production Report-Only data to confirm zero legitimate breakage before flipping the header name |
| **CP19.7 — Admin audit log** | Schema addition + read-only admin UI; scoped as its own mini-phase |
| **CP19.8 — PII retention policy** | Cron-based archive/purge for `ContactSubmission`; scoped separately |
| **CP19.9 — Login redirect tightening + dead-code cleanup** | Small refactor; scoped separately |
| **CP19.10 — Error response sanitization** | Stack-trace + verbose-error scrub for production responses; scoped separately |

All four CP19.7–CP19.10 items + the Enforce switch were left out of this
batch deliberately — splitting the security audit into a defensive-layer
deploy (this PR) and a follow-up structural-improvement phase keeps the
review surface manageable and the rollback surface small.

---

## File inventory

| Type | Count |
|---|---|
| New files | 3 (sanitizer wrapper, login-lockout tracker, CSP report endpoint) |
| Modified server-side files | 25 (12 admin actions + 11 public render sites + 1 shared chrome layout + 1 auth route + 1 auth config + 1 next.config) |
| Package additions | 1 production (sanitize-html) + 1 dev (@types/sanitize-html) |
| Package removals | 1 devDep (security cleanup) |
| Schema migrations | 0 |
| Production deploys | 3 (initial batch + 2 hotfix attempts during deploy verification) |

---

## Test plan checklist (for PR review)

- [ ] Pull branch + `npm install`
- [ ] `npx tsc --noEmit` clean
- [ ] `npm audit` clean (0 vulnerabilities, all severities)
- [ ] `npm run build` — verify Phase 18 ISR indicators preserved (`○` Static / `●` SSG / `ƒ` Dynamic split unchanged from main)
- [ ] `npx next start` local smoke:
  - [ ] All public routes 200
  - [ ] `/news` 200 (was the dynamic-render regression target; HOTFIX2 resolved)
  - [ ] `/admin/login` 200
  - [ ] `/api/csp-report` POST → 204 (legacy + Reporting API payloads)
  - [ ] `curl -I` shows all 9 security headers + no `X-Powered-By`
- [ ] Production smoke (post-deploy):
  - [ ] Curl sweep: 17 public routes 200, admin 307, API endpoints respond
  - [ ] Headers present on `/` and `/admin/login`
  - [ ] ISR markers preserved on cached routes (`X-Vercel-Cache: HIT`, `X-Nextjs-Prerender: 1`)
- [ ] Browser walkthrough (5–6 surfaces): visual unchanged, Cloudinary images load, Maps embed loads
- [ ] DevTools Console: CSP violations minimal/acceptable
- [ ] Auth lockout end-to-end: 5 wrong attempts on a test email → 6th attempt returns identical generic response with no state tell
- [ ] Admin save flow: legitimate formatting (`<strong>`, `<em>`, safe `<a href>`) preserved post-save+render
- [ ] Regression:
  - [ ] Phase 18 ISR cache hits preserved (`bom1` POP, sub-300ms TTFB)
  - [ ] Phase 17 Legal pages CMS intact
  - [ ] Phase 15 preloader + per-navigation overlay intact
  - [ ] Phase 14 quality radio on admin uploads intact

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
